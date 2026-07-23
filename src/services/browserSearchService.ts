type SearchQuery = (queryInfo: {
  text: string;
  disposition: "NEW_TAB";
}) => void | Promise<void>;

type ChromiumExtensionApi = {
  search?: {
    query?: SearchQuery;
  };
};

/**
 * Chromium 浏览器搜索适配器。
 */
export class BrowserSearchService {
  /**
   * 获取浏览器默认搜索方法。
   */
  private getSearchQuery(): SearchQuery | undefined {
    // 当前 Chromium 扩展 API
    const chromiumApi = (
      globalThis as typeof globalThis & { chrome?: ChromiumExtensionApi }
    ).chrome;
    return chromiumApi?.search?.query?.bind(chromiumApi.search);
  }

  /**
   * 判断当前浏览器是否支持默认搜索。
   */
  isDefaultSearchSupported(): boolean {
    return Boolean(this.getSearchQuery());
  }

  /**
   * 使用当前浏览器的默认搜索提供商。
   */
  searchWithDefault(query: string): boolean {
    // 浏览器默认搜索方法
    const searchQuery = this.getSearchQuery();
    if (!searchQuery) {
      return false;
    }

    void searchQuery({
      text: query,
      disposition: "NEW_TAB",
    });
    return true;
  }

  /**
   * 使用用户自定义搜索引擎。
   */
  searchWithCustomEngine(searchUrl: string, query: string): void {
    // 替换关键词后的目标地址
    const targetUrl = searchUrl.replace("%s", encodeURIComponent(query));
    window.open(targetUrl, "_blank");
  }
}

// 浏览器搜索服务单例
export const browserSearchService = new BrowserSearchService();
