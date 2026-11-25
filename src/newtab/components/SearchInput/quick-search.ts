import { LinkType, type CategoryInfo, type Link } from "@/type/db";

export interface QuickSearchResult {
  link: Link;
  categoryName: string;
  groupName?: string;
}

/** 预构建的本地快速搜索小写索引条目，避免输入与键盘导航期间重复扁平化。 */
export interface QuickSearchIndexEntry {
  result: QuickSearchResult;
  originalIndex: number;
  normalizedTitle: string;
  normalizedUrl: string;
  normalizedDescription: string;
}

// 快速搜索最多展示的本地网址数量
const QUICK_SEARCH_RESULT_LIMIT = 6;
// 快速搜索结果列表标识
export const QUICK_SEARCH_LIST_ID = "quick-search-results";
// 网页搜索操作标识
export const WEB_SEARCH_OPTION_ID = "quick-search-web-option";

/** 将分类数据展开并预计算小写索引条目。 */
export function buildQuickSearchIndex(
  categories: CategoryInfo[]
): QuickSearchIndexEntry[] {
  const entries: QuickSearchIndexEntry[] = [];
  let originalIndex = 0;

  for (const category of categories) {
    for (const item of category.items) {
      if (item.type === LinkType.LINK) {
        entries.push({
          result: { link: item, categoryName: category.name },
          originalIndex: originalIndex++,
          normalizedTitle: item.title.toLowerCase(),
          normalizedUrl: item.url.toLowerCase(),
          normalizedDescription: item.description.toLowerCase(),
        });
      } else {
        for (const link of item.links) {
          entries.push({
            result: {
              link,
              categoryName: category.name,
              groupName: item.name,
            },
            originalIndex: originalIndex++,
            normalizedTitle: link.title.toLowerCase(),
            normalizedUrl: link.url.toLowerCase(),
            normalizedDescription: link.description.toLowerCase(),
          });
        }
      }
    }
  }

  return entries;
}

/** 基于预构建索引按标题、网址和描述匹配并排序本地网址。 */
export function searchLocalLinksFromIndex(
  index: QuickSearchIndexEntry[],
  query: string
): QuickSearchResult[] {
  // 标准化后的搜索内容
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const matched: Array<{
    result: QuickSearchResult;
    originalIndex: number;
    matchRank: number;
  }> = [];

  for (const entry of index) {
    const matchRank = entry.normalizedTitle.startsWith(normalizedQuery)
      ? 0
      : entry.normalizedTitle.includes(normalizedQuery)
        ? 1
        : entry.normalizedUrl.includes(normalizedQuery)
          ? 2
          : entry.normalizedDescription.includes(normalizedQuery)
            ? 3
            : -1;

    if (matchRank >= 0) {
      matched.push({
        result: entry.result,
        originalIndex: entry.originalIndex,
        matchRank,
      });
    }
  }

  matched.sort(
    (left, right) =>
      left.matchRank - right.matchRank ||
      left.originalIndex - right.originalIndex
  );

  return matched
    .slice(0, QUICK_SEARCH_RESULT_LIMIT)
    .map((item) => item.result);
}

/** 按标题、网址和描述匹配并排序本地网址。 */
export function searchLocalLinks(
  categories: CategoryInfo[],
  query: string
): QuickSearchResult[] {
  return searchLocalLinksFromIndex(buildQuickSearchIndex(categories), query);
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
