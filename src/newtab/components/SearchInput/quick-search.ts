import { LinkType, type CategoryInfo, type Link } from "@/type/db";

export interface QuickSearchResult {
  link: Link;
  categoryName: string;
  groupName?: string;
}

// 快速搜索最多展示的本地网址数量
const QUICK_SEARCH_RESULT_LIMIT = 6;
// 快速搜索结果列表标识
export const QUICK_SEARCH_LIST_ID = "quick-search-results";
// 网页搜索操作标识
export const WEB_SEARCH_OPTION_ID = "quick-search-web-option";

/** 将分类数据展开为可检索的本地网址。 */
function flattenSearchResults(categories: CategoryInfo[]): QuickSearchResult[] {
  return categories.flatMap((category) =>
    category.items.flatMap((item) => {
      if (item.type === LinkType.LINK) {
        return [{ link: item, categoryName: category.name }];
      }

      return item.links.map((link) => ({
        link,
        categoryName: category.name,
        groupName: item.name,
      }));
    })
  );
}

/** 按标题和网址匹配并排序本地网址。 */
export function searchLocalLinks(
  categories: CategoryInfo[],
  query: string
): QuickSearchResult[] {
  // 标准化后的搜索内容
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return flattenSearchResults(categories)
    .map((result, originalIndex) => {
      // 标准化后的网址标题
      const normalizedTitle = result.link.title.toLocaleLowerCase();
      // 标准化后的网址
      const normalizedUrl = result.link.url.toLocaleLowerCase();
      // 当前结果的匹配优先级
      const matchRank = normalizedTitle.startsWith(normalizedQuery)
        ? 0
        : normalizedTitle.includes(normalizedQuery)
          ? 1
          : normalizedUrl.includes(normalizedQuery)
            ? 2
            : -1;

      return { result, originalIndex, matchRank };
    })
    .filter((item) => item.matchRank >= 0)
    .sort(
      (left, right) =>
        left.matchRank - right.matchRank ||
        left.originalIndex - right.originalIndex
    )
    .slice(0, QUICK_SEARCH_RESULT_LIMIT)
    .map((item) => item.result);
}

/** 提取快速搜索结果中展示的域名。 */
export function getResultHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** 生成本地网址选项的无障碍标识。 */
export function getQuickSearchOptionId(result: QuickSearchResult): string {
  return `quick-search-link-${result.link.id}`;
}
