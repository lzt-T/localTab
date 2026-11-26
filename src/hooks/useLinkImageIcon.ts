import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import {
  getLinkImageIconCandidates,
  isBrowserFaviconIcon,
  isImageIcon,
  resolveLinkIcon,
} from "@/utils/icon";
import {
  isBrowserDefaultFaviconImage,
  probeFirstAvailableFavicon,
} from "@/utils/webIcon";

// 跨标签页共享的已解析真实图标本地缓存键
const RESOLVED_FAVICON_CACHE_STORAGE_KEY = "localtab:resolved-favicon-cache:v1";
// 本地缓存允许保存的最大条目数
const MAX_CACHE_ENTRIES = 500;

// 内存态镜像缓存，避免重复解析 localStorage
let resolvedFaviconCache: Map<string, string> | null = null;
// 相同页面地址的进行中探测任务去重表
const inFlightProbes = new Map<string, Promise<string>>();

interface ProbedIconState {
  key: string;
  src: string;
}

/** 懒加载内存态与 localStorage 同步的图标缓存表。 */
function getCacheStore(): Map<string, string> {
  if (resolvedFaviconCache !== null) {
    return resolvedFaviconCache;
  }

  const store = new Map<string, string>();
  try {
    const raw = window.localStorage.getItem(RESOLVED_FAVICON_CACHE_STORAGE_KEY);
    if (raw) {
      const entries: unknown = JSON.parse(raw);
      if (Array.isArray(entries)) {
        for (const entry of entries) {
          if (
            Array.isArray(entry) &&
            typeof entry[0] === "string" &&
            typeof entry[1] === "string" &&
            entry[0] &&
            entry[1]
          ) {
            store.set(entry[0], entry[1]);
          }
        }
      }
    }
  } catch {
    // 忽略本地存储读取或解析异常，保持空缓存降级
  }

  resolvedFaviconCache = store;
  return store;
}

/** 将最新图标缓存表持久化到 localStorage。 */
function persistCacheStore(store: Map<string, string>): void {
  try {
    window.localStorage.setItem(
      RESOLVED_FAVICON_CACHE_STORAGE_KEY,
      JSON.stringify(Array.from(store.entries()))
    );
  } catch {
    // 忽略本地存储容量或禁用导致的写入失败
  }
}

/** 计算浏览器 `_favicon` 图标对应的稳定页面缓存键。 */
function getBrowserFaviconCacheKey(icon: string, url?: string): string {
  const trimmedUrl = url?.trim();
  if (trimmedUrl) {
    return trimmedUrl;
  }

  try {
    const pageUrl = new URL(icon).searchParams.get("pageUrl")?.trim();
    if (pageUrl) {
      return pageUrl;
    }
  } catch {
    // 忽略非法 URL，回退使用原图标字符串
  }

  return icon;
}

/** 从缓存读取已确认可用的真实图标地址，并自动重写旧扩展 ID。 */
function getCachedBrowserFavicon(
  cacheKey: string,
  candidates: string[]
): string {
  const store = getCacheStore();
  const rawCached = store.get(cacheKey);
  if (!rawCached) {
    return "";
  }

  const normalized = isBrowserFaviconIcon(rawCached)
    ? resolveLinkIcon(rawCached)
    : rawCached;
  if (!normalized || !candidates.includes(normalized)) {
    return "";
  }

  if (normalized !== rawCached) {
    store.set(cacheKey, normalized);
    persistCacheStore(store);
  }
  return normalized;
}

/** 写入已确认可用的真实图标地址，超出上限时淘汰最早条目。 */
function saveCachedBrowserFavicon(cacheKey: string, resolvedSrc: string): void {
  const store = getCacheStore();
  if (store.has(cacheKey)) {
    store.delete(cacheKey);
  }
  store.set(cacheKey, resolvedSrc);
  while (store.size > MAX_CACHE_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    store.delete(oldestKey);
  }
  persistCacheStore(store);
}

/** 删除失效的缓存图标条目。 */
function deleteCachedBrowserFavicon(cacheKey: string): void {
  const store = getCacheStore();
  if (store.delete(cacheKey)) {
    persistCacheStore(store);
  }
}

/** 后台并发探测首个可用图标并共享去重进行中的请求。 */
function probeBrowserFavicon(
  cacheKey: string,
  candidates: string[]
): Promise<string> {
  const existingTask = inFlightProbes.get(cacheKey);
  if (existingTask) {
    return existingTask;
  }

  const probeTask = probeFirstAvailableFavicon(candidates)
    .then((matchedSrc) => {
      if (matchedSrc) {
        saveCachedBrowserFavicon(cacheKey, matchedSrc);
      }
      return matchedSrc;
    })
    .finally(() => {
      inFlightProbes.delete(cacheKey);
    });

  inFlightProbes.set(cacheKey, probeTask);
  return probeTask;
}

/**
 * 管理链接图片图标的后台并发探测、跨标签页缓存与首字母回退状态。
 * 对浏览器 `_favicon` 地址先稳稳展示首字母徽标，探测确认真实可用后再一次性渲染图片。
 */
export function useLinkImageIcon(icon: string, url?: string) {
  // 当前输入是否来自 Chromium 浏览器缓存接口
  const isBrowserFavicon = isBrowserFaviconIcon(icon);
  // 当前链接图标与地址对应的稳定键
  const candidateKey = `${icon}\0${url ?? ""}`;
  // 用于跨标签页复用的页面维度缓存键
  const cacheKey = isBrowserFavicon
    ? getBrowserFaviconCacheKey(icon, url)
    : "";
  // 记录最新键以防异步回调竞态污染新状态
  const latestKeyRef = useRef(candidateKey);

  // 普通远程或自定义图片加载失败的键
  const [failedDirectKey, setFailedDirectKey] = useState("");
  // 本次会话已主动失效过缓存的键（避免单次重探死循环）
  const [invalidatedCacheKey, setInvalidatedCacheKey] = useState("");
  // 后台探测无结果或结果失效的键
  const [failedProbedKey, setFailedProbedKey] = useState("");
  // 后台探测命中的真实图标地址
  const [probedState, setProbedState] = useState<ProbedIconState>({
    key: "",
    src: "",
  });

  useEffect(() => {
    latestKeyRef.current = candidateKey;
  }, [candidateKey]);

  // 浏览器 `_favicon` 对应的候选图标列表
  const candidates = isBrowserFavicon
    ? getLinkImageIconCandidates(icon, url)
    : [];
  // 当前是否已失效本地缓存
  const isCacheInvalidated = invalidatedCacheKey === candidateKey;
  // 命中缓存的真实图标地址
  const cachedSrc =
    isBrowserFavicon && !isCacheInvalidated
      ? getCachedBrowserFavicon(cacheKey, candidates)
      : "";
  // 本次挂载后台探测命中的真实图标地址
  const probedSrc =
    isBrowserFavicon &&
    failedProbedKey !== candidateKey &&
    probedState.key === candidateKey
      ? probedState.src
      : "";
  // 已确认可用的浏览器图标地址
  const confirmedBrowserSrc = cachedSrc || probedSrc;
  // 是否需要在后台并发探测有效图标
  const needsProbe =
    isBrowserFavicon &&
    !confirmedBrowserSrc &&
    failedProbedKey !== candidateKey &&
    candidates.length > 0;

  useEffect(() => {
    if (!needsProbe) {
      return;
    }

    let cancelled = false;
    const targetCandidates = getLinkImageIconCandidates(icon, url);
    void probeBrowserFavicon(cacheKey, targetCandidates).then((matchedSrc) => {
      if (cancelled || latestKeyRef.current !== candidateKey) {
        return;
      }
      if (matchedSrc) {
        setProbedState({ key: candidateKey, src: matchedSrc });
      } else {
        setFailedProbedKey(candidateKey);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [needsProbe, cacheKey, candidateKey, icon, url]);

  // 非 `_favicon` 图片（普通远程地址或自定义 Data URL）直接走首帧直出
  const isDirectImage = !isBrowserFavicon && isImageIcon(icon);
  const iconSrc = isBrowserFavicon
    ? confirmedBrowserSrc
    : isDirectImage && failedDirectKey !== candidateKey
      ? icon
      : "";
  const shouldShowImage = Boolean(iconSrc);
  const shouldShowMonogram =
    !shouldShowImage &&
    (isBrowserFavicon || isDirectImage || !icon || icon === "link");

  /** 处理已展示图片的加载失败并触发单次缓存自愈或回退。 */
  function onImageError() {
    if (!isBrowserFavicon) {
      setFailedDirectKey(candidateKey);
      return;
    }

    if (cachedSrc) {
      deleteCachedBrowserFavicon(cacheKey);
      setInvalidatedCacheKey(candidateKey);
      return;
    }

    setFailedProbedKey(candidateKey);
  }

  /** 对缓存直出或已加载的 `_favicon` 图片做默认空白占位图自检。 */
  function onImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    if (!isBrowserFavicon || !iconSrc) {
      return;
    }

    const imageElement = event.currentTarget;
    const attemptKey = candidateKey;
    const attemptCacheKey = cacheKey;
    const attemptSrc = iconSrc;
    const wasFromCache = Boolean(cachedSrc);

    void isBrowserDefaultFaviconImage(imageElement, attemptSrc).then(
      (isDefaultPlaceholder) => {
        if (!isDefaultPlaceholder || latestKeyRef.current !== attemptKey) {
          return;
        }
        if (wasFromCache) {
          deleteCachedBrowserFavicon(attemptCacheKey);
          setInvalidatedCacheKey(attemptKey);
        } else {
          setFailedProbedKey(attemptKey);
        }
      }
    );
  }

  return {
    iconSrc,
    shouldShowImage,
    shouldShowMonogram,
    onImageLoad,
    onImageError,
  };
}
