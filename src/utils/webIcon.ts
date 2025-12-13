/**
 * 网站图标获取工具
 * 用于从网站 URL 获取 favicon
 */

/**
 * 获取网站的默认 favicon URL
 * @param urlString 网站 URL
 * @returns favicon URL，如果解析失败返回空字符串
 */
export function getFaviconUrl(urlString: string): string {
  try {
    const fullUrl = urlString.startsWith('http') ? urlString : `https://${urlString}`;
    const urlObj = new URL(fullUrl);
    const origin = urlObj.origin;
    // 直接访问网站的 favicon.ico
    return `${origin}/favicon.ico`;
  } catch {
    return '';
  }
}

/**
 * 获取所有可能的 favicon URL 列表
 * @param urlString 网站 URL
 * @returns favicon URL 数组
 */
export function getFaviconUrls(urlString: string): string[] {
  try {
    const fullUrl = urlString.startsWith('http') ? urlString : `https://${urlString}`;
    const urlObj = new URL(fullUrl);
    const origin = urlObj.origin;
    
    // 常见的 favicon 路径
    return [
      `${origin}/favicon.ico`,
      `${origin}/favicon.png`,
      `${origin}/apple-touch-icon.png`,
      `${origin}/icon.png`,
    ];
  } catch {
    return [];
  }
}

/**
 * 检查图片是否可访问
 * @param url 图片 URL
 * @param timeout 超时时间（毫秒），默认 3000
 * @returns Promise<boolean> 图片是否存在
 */
export function checkImageExists(url: string, timeout: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
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
    return '';
  }

  try {
    const faviconUrls = getFaviconUrls(urlString.trim());
    
    // 依次尝试每个 favicon URL
    for (const faviconUrl of faviconUrls) { 
      const exists = await checkImageExists(faviconUrl);
      if (exists) {
        return faviconUrl;
      }
    }
    
    // 如果所有路径都失败，返回空字符串
    return '';
  } catch (error) {
    console.error('获取 favicon 失败:', error);
    return '';
  }
}

