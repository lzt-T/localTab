/**
 * 网站图标获取工具
 * 用于从网站 URL 并发探测并返回可用 favicon
 */

type ChromiumExtensionApi = {
  runtime?: {
    id?: string;
    getURL?: (path: string) => string;
  };
};

// 网站图标请求尺寸
const FAVICON_SIZE = 64;
// 探测超时毫秒数
const FAVICON_PROBE_TIMEOUT_MS = 3000;
// 用于探测浏览器默认空白占位图的固定不可达地址
const DEFAULT_FAVICON_PROBE_PAGE_URL = "https://favicon-fallback.invalid/";
// 用于生成图像像素签名的离屏画布尺寸
const FAVICON_SIGNATURE_SIZE = 32;
// 按图标尺寸缓存浏览器默认空白占位图签名
const defaultFaviconSignatureCache = new Map<number, Promise<string | null>>();

/**
 * 规范化网站地址。
 * @param urlString 网站 URL
 * @returns 补全协议后的 URL，解析失败时返回 undefined
 */
function normalizeWebsiteUrl(urlString: string): URL | undefined {
  try {
    // 去除首尾空白的网站地址
    const trimmedUrl = urlString.trim();
    if (!trimmedUrl) {
      return undefined;
    }
    // 补全协议后的网站地址
    const fullUrl = trimmedUrl.startsWith("http")
      ? trimmedUrl
      : `https://${trimmedUrl}`;
    return new URL(fullUrl);
  } catch {
    return undefined;
  }
}

/**
 * 判断输入地址是否已形成有效主机名，避免半截输入发起无效图标请求。
 */
export function isFetchableWebsiteUrl(urlString: string): boolean {
  const websiteUrl = normalizeWebsiteUrl(urlString);
  if (!websiteUrl) {
    return false;
  }
  const { hostname } = websiteUrl;
  if (hostname === "localhost") {
    return true;
  }
  const labels = hostname.split(".");
  return labels.length >= 2 && labels.every((label) => label.length > 0);
}

/**
 * 获取 Chromium 扩展缓存的网站图标地址。
 * @param pageUrl 网站页面地址
 * @param size 图标尺寸
 * @returns 浏览器 favicon 接口地址，不支持或上下文失效时返回空字符串
 */
export function getBrowserFaviconUrl(
  pageUrl: string,
  size: number = FAVICON_SIZE
): string {
  // 当前 Chromium 扩展 API
  const chromiumApi = (
    globalThis as typeof globalThis & { chrome?: ChromiumExtensionApi }
  ).chrome;
  // 扩展资源地址生成方法
  const getExtensionUrl = chromiumApi?.runtime?.getURL;
  if (!chromiumApi?.runtime?.id || !getExtensionUrl) {
    return "";
  }

  try {
    // 浏览器 favicon 接口地址
    const faviconUrl = new URL(getExtensionUrl("/_favicon/"));
    if (
      faviconUrl.protocol !== "chrome-extension:" ||
      !faviconUrl.hostname ||
      faviconUrl.hostname === "invalid"
    ) {
      return "";
    }
    faviconUrl.searchParams.set("pageUrl", pageUrl);
    faviconUrl.searchParams.set("size", String(size));
    return faviconUrl.toString();
  } catch {
    return "";
  }
}

/**
 * 获取网站的默认 favicon URL
 * @param urlString 网站 URL
 * @returns favicon URL，如果解析失败返回空字符串
 */
export function getFaviconUrl(urlString: string): string {
  // 规范化后的网站地址
  const websiteUrl = normalizeWebsiteUrl(urlString);
  return websiteUrl ? `${websiteUrl.origin}/favicon.ico` : "";
}

/**
 * 获取站点直连的常见 favicon 候选地址列表。
 * @param websiteUrl 规范化后的网站 URL
 * @returns 站点直连 favicon URL 数组
 */
function getDirectFaviconUrlsForWebsite(websiteUrl: URL): string[] {
  return [
    `${websiteUrl.origin}/favicon.ico`,
    `${websiteUrl.origin}/favicon.svg`,
    `${websiteUrl.origin}/favicon.png`,
    `${websiteUrl.origin}/apple-touch-icon.png`,
    `${websiteUrl.origin}/icon.png`,
  ];
}

/**
 * 根据网站地址获取站点直连的常见 favicon 候选列表。
 * @param urlString 网站 URL
 * @returns 站点直连 favicon URL 数组，解析失败时返回空数组
 */
export function getDirectFaviconUrls(urlString: string): string[] {
  const websiteUrl = normalizeWebsiteUrl(urlString);
  return websiteUrl ? getDirectFaviconUrlsForWebsite(websiteUrl) : [];
}

/**
 * 获取所有可能的 favicon URL 列表
 * @param urlString 网站 URL
 * @returns favicon URL 数组
 */
export function getFaviconUrls(urlString: string): string[] {
  // 规范化后的网站地址
  const websiteUrl = normalizeWebsiteUrl(urlString);
  if (!websiteUrl) {
    return [];
  }

  // Chromium 浏览器缓存的 favicon 地址
  const browserFaviconUrl = getBrowserFaviconUrl(websiteUrl.toString());
  // 浏览器接口和常见 favicon 路径
  return [
    browserFaviconUrl,
    ...getDirectFaviconUrlsForWebsite(websiteUrl),
  ].filter(Boolean);
}

/** 判断地址是否为 Chromium 扩展内置 favicon 接口。 */
function isBrowserFaviconUrl(url: string): boolean {
  try {
    return (
      url.startsWith("chrome-extension://") &&
      new URL(url).pathname === "/_favicon/"
    );
  } catch {
    return false;
  }
}

/** 提取浏览器 favicon 地址中的图标尺寸参数。 */
function getBrowserFaviconSize(url: string): number {
  try {
    const rawSize = Number(new URL(url).searchParams.get("size"));
    return Number.isFinite(rawSize) && rawSize > 0 ? rawSize : FAVICON_SIZE;
  } catch {
    return FAVICON_SIZE;
  }
}

/** 将已加载图片缩放绘制到离屏画布并生成像素签名。 */
function getImageSignature(img: HTMLImageElement): string | null {
  if (!img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
    return null;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = FAVICON_SIGNATURE_SIZE;
    canvas.height = FAVICON_SIGNATURE_SIZE;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    context.clearRect(0, 0, FAVICON_SIGNATURE_SIZE, FAVICON_SIGNATURE_SIZE);
    context.drawImage(
      img,
      0,
      0,
      FAVICON_SIGNATURE_SIZE,
      FAVICON_SIGNATURE_SIZE
    );
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** 加载并缓存指定尺寸的浏览器默认空白 favicon 像素签名。 */
function getDefaultFaviconSignature(size: number): Promise<string | null> {
  const cachedPromise = defaultFaviconSignatureCache.get(size);
  if (cachedPromise) {
    return cachedPromise;
  }

  const probeUrl = getBrowserFaviconUrl(DEFAULT_FAVICON_PROBE_PAGE_URL, size);
  if (!probeUrl) {
    return Promise.resolve(null);
  }

  const signaturePromise = new Promise<string | null>((resolve) => {
    const img = new Image();
    let settled = false;
    let timerId: number | undefined;

    const finish = (signature: string | null) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        timerId = undefined;
      }
      img.onload = null;
      img.onerror = null;
      if (!signature) {
        img.removeAttribute("src");
      }
      resolve(signature);
    };

    img.onload = () => finish(getImageSignature(img));
    img.onerror = () => finish(null);
    timerId = window.setTimeout(() => finish(null), FAVICON_PROBE_TIMEOUT_MS);
    img.src = probeUrl;
  });

  const pendingPromise = signaturePromise.then((signature) => {
    if (
      !signature &&
      defaultFaviconSignatureCache.get(size) === pendingPromise
    ) {
      defaultFaviconSignatureCache.delete(size);
    }
    return signature;
  });

  defaultFaviconSignatureCache.set(size, pendingPromise);
  return pendingPromise;
}

/**
 * 判断图片元素加载结果是否为浏览器 `_favicon` 返回的默认空白占位图。
 * @param img 已触发 load 的图片元素
 * @param url 可选图标地址，默认取元素当前源地址
 * @returns 若确认为默认空白占位图则返回 true
 */
export async function isBrowserDefaultFaviconImage(
  img: HTMLImageElement,
  url: string = img.currentSrc || img.src
): Promise<boolean> {
  if (!isBrowserFaviconUrl(url)) {
    return false;
  }

  // 在异步等待签名缓存前同步提取当前图像的像素签名
  const imageSignature = getImageSignature(img);
  if (!imageSignature) {
    return false;
  }

  const fallbackSignature = await getDefaultFaviconSignature(
    getBrowserFaviconSize(url)
  );
  return Boolean(fallbackSignature) && imageSignature === fallbackSignature;
}

/**
 * 检查图片是否可访问，支持超时清理与 AbortSignal 中止。
 * @param url 图片 URL
 * @param timeout 超时时间（毫秒），默认 3000
 * @param signal 可选中止信号
 * @returns Promise<boolean> 图片是否存在
 */
export function checkImageExists(
  url: string,
  timeout: number = FAVICON_PROBE_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<boolean> {
  if (signal?.aborted) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    let timerId: number | undefined;

    const cleanup = () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        timerId = undefined;
      }
      signal?.removeEventListener("abort", handleAbort);
      img.onload = null;
      img.onerror = null;
    };

    const finish = (exists: boolean, shouldAbortImage = false) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      if (shouldAbortImage) {
        img.removeAttribute("src");
      }
      resolve(exists);
    };

    const handleAbort = () => {
      finish(false, true);
    };

    signal?.addEventListener("abort", handleAbort, { once: true });
    img.onload = () => {
      if (!isBrowserFaviconUrl(url)) {
        finish(true);
        return;
      }
      void isBrowserDefaultFaviconImage(img, url).then((isDefaultPlaceholder) =>
        finish(!isDefaultPlaceholder)
      );
    };
    img.onerror = () => finish(false);
    timerId = window.setTimeout(() => finish(false, true), timeout);
    img.src = url;
  });
}

/**
 * 并发探测候选图标列表，按顺序返回首个可用图标地址并中止其余探测。
 * @param faviconUrls 按优先级排列的图标候选地址
 * @param signal 可选外部中止信号
 * @returns Promise<string> 首个可用图标 URL，均不可用时返回空字符串
 */
export async function probeFirstAvailableFavicon(
  faviconUrls: string[],
  signal?: AbortSignal
): Promise<string> {
  if (faviconUrls.length === 0 || signal?.aborted) {
    return "";
  }

  // 用于在较高优先级图标命中或外部取消时中止剩余探测请求
  const innerController = new AbortController();
  const handleExternalAbort = () => {
    innerController.abort();
  };
  signal?.addEventListener("abort", handleExternalAbort, { once: true });

  try {
    // 并发探测所有候选图标地址，再按优先级依次检查结果
    const probePromises = faviconUrls.map((faviconUrl) =>
      checkImageExists(
        faviconUrl,
        FAVICON_PROBE_TIMEOUT_MS,
        innerController.signal
      )
    );

    for (let index = 0; index < probePromises.length; index++) {
      const exists = await probePromises[index];
      if (signal?.aborted) {
        return "";
      }
      if (exists) {
        innerController.abort();
        return faviconUrls[index];
      }
    }

    return "";
  } finally {
    innerController.abort();
    signal?.removeEventListener("abort", handleExternalAbort);
  }
}

/**
 * 并发探测网站可能的 favicon 地址，按优先级返回首个可用图标并中止其余探测。
 * @param urlString 网站 URL
 * @param signal 可选外部中止信号
 * @returns Promise<string> favicon URL，若均不可访问则返回空字符串
 */
export async function fetchFavicon(
  urlString: string,
  signal?: AbortSignal
): Promise<string> {
  const trimmedUrl = urlString.trim();
  if (!trimmedUrl || !isFetchableWebsiteUrl(trimmedUrl) || signal?.aborted) {
    return "";
  }

  try {
    // 规范化后的网站地址
    const websiteUrl = normalizeWebsiteUrl(trimmedUrl);
    if (!websiteUrl) {
      return "";
    }

    // 优先探测站点直连图标，避免缓存未命中时提前命中浏览器空白占位图
    const faviconUrls = [
      ...getDirectFaviconUrlsForWebsite(websiteUrl),
      getBrowserFaviconUrl(websiteUrl.toString()),
    ].filter(Boolean);
    return await probeFirstAvailableFavicon(faviconUrls, signal);
  } catch (error) {
    console.error("获取 favicon 失败:", error);
    return "";
  }
}
