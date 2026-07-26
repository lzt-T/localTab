/**
 * 网站图标获取工具
 * 用于从网站 URL 获取 favicon
 */

type ChromiumExtensionApi = {
  runtime?: {
    getURL?: (path: string) => string;
  };
};

// 网站图标请求尺寸
const FAVICON_SIZE = 64;

/**
 * 规范化网站地址。
 * @param urlString 网站 URL
 * @returns 补全协议后的 URL，解析失败时返回 undefined
 */
function normalizeWebsiteUrl(urlString: string): URL | undefined {
  try {
    // 去除首尾空白的网站地址
    const trimmedUrl = urlString.trim();
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
 * 检查图片是否可访问
 * @param url 图片 URL
 * @param timeout 超时时间（毫秒），默认 3000
 * @returns Promise<boolean> 图片是否存在
 */
export function checkImageExists(url: string, timeout: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    // 用于验证地址的临时图片
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    // 设置超时
    setTimeout(() => resolve(false), timeout);
  });
}

/**
 * 获取网站的 favicon URL
 * 会尝试多个常见路径，返回第一个可访问的
 * @param urlString 网站 URL
 * @returns Promise<string> favicon URL，如果都失败则返回默认的 favicon.ico
 */
export async function fetchFavicon(urlString: string): Promise<string> {
  if (!urlString.trim()) {
    return "";
  }

  try {
    // 按优先级排列的网站图标地址
    const faviconUrls = getFaviconUrls(urlString.trim());

    // 依次尝试每个 favicon URL
    for (const faviconUrl of faviconUrls) {
      // 当前图标地址是否可访问
      const exists = await checkImageExists(faviconUrl);
      if (exists) {
        return faviconUrl;
      }
    }

    // 如果所有路径都失败，返回空字符串
    return "";
  } catch (error) {
    console.error("获取 favicon 失败:", error);
    return "";
  }
}

