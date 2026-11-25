/**
 * 网站图标获取工具
 * 用于从网站 URL 并发探测并返回可用 favicon
 */

type ChromiumExtensionApi = {
  runtime?: {
    getURL?: (path: string) => string;
  };
};

// 网站图标请求尺寸
const FAVICON_SIZE = 64;
// 探测超时毫秒数
const FAVICON_PROBE_TIMEOUT_MS = 3000;

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
 * @returns 浏览器 favicon 接口地址，不支持时返回空字符串
 */
function getBrowserFaviconUrl(pageUrl: string): string {
  // 当前 Chromium 扩展 API
  const chromiumApi = (
    globalThis as typeof globalThis & { chrome?: ChromiumExtensionApi }
  ).chrome;
  // 扩展资源地址生成方法
  const getExtensionUrl = chromiumApi?.runtime?.getURL;
  if (!getExtensionUrl) {
    return "";
  }

  // 浏览器 favicon 接口地址
  const faviconUrl = new URL(getExtensionUrl("/_favicon/"));
  faviconUrl.searchParams.set("pageUrl", pageUrl);
  faviconUrl.searchParams.set("size", String(FAVICON_SIZE));
  return faviconUrl.toString();
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
    `${websiteUrl.origin}/favicon.ico`,
    `${websiteUrl.origin}/favicon.png`,
    `${websiteUrl.origin}/apple-touch-icon.png`,
    `${websiteUrl.origin}/icon.png`,
  ].filter(Boolean);
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
        img.src = "";
      }
      resolve(exists);
    };

    const handleAbort = () => {
      finish(false, true);
    };

    signal?.addEventListener("abort", handleAbort, { once: true });
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    timerId = window.setTimeout(() => finish(false, true), timeout);
    img.src = url;
  });
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

  // 用于在较高优先级图标命中或外部取消时中止剩余探测请求
  const innerController = new AbortController();
  const handleExternalAbort = () => {
    innerController.abort();
  };
  signal?.addEventListener("abort", handleExternalAbort, { once: true });

  try {
    // 按优先级排列的网站图标地址
    const faviconUrls = getFaviconUrls(trimmedUrl);
    if (faviconUrls.length === 0) {
      return "";
    }

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
  } catch (error) {
    console.error("获取 favicon 失败:", error);
    return "";
  } finally {
    innerController.abort();
    signal?.removeEventListener("abort", handleExternalAbort);
  }
}
