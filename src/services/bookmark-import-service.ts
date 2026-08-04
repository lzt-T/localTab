import { LinkType, type Category, type Link, type LinkGroup } from "@/type/db";
import type { BrowserBookmarkNode } from "@/services/browser-bookmark-service";
import { categoryService } from "@/services/categoryService";
import { getUniqueId } from "@/utils/base";
import { db } from "@/utils/db";
import { getFaviconUrls } from "@/utils/webIcon";

/** 浏览器书签导入时跳过的项目统计。 */
export interface BookmarkImportSkippedSummary {
  duplicate: number;
  invalid: number;
}

/** 浏览器书签导入计划。 */
export interface BookmarkImportPlan {
  categories: Category[];
  linkGroups: LinkGroup[];
  links: Link[];
  skipped: BookmarkImportSkippedSummary;
}

/** 构建书签导入计划所需的本地上下文。 */
export interface BookmarkImportPlanOptions {
  existingCategories: Category[];
  importSuffix: string;
  unnamedCategoryName: string;
  unnamedFolderName: string;
}

/** 页面提供的导入命名文案。 */
export type BookmarkImportLabels = Omit<
  BookmarkImportPlanOptions,
  "existingCategories"
>;

/** 实际导入和预览使用的汇总数据。 */
export interface BookmarkImportSummary {
  categoryCount: number;
  folderCount: number;
  linkCount: number;
  duplicateCount: number;
  invalidCount: number;
}

/** 单个分类转换过程中的可变上下文。 */
interface CategoryBuildContext {
  categoryId: string;
  links: Link[];
  linkGroups: LinkGroup[];
  seenUrls: Set<string>;
  usedFolderNames: Set<string>;
  skipped: BookmarkImportSkippedSummary;
  nextItemSort: number;
  unnamedFolderName: string;
}

/** 校验并规范化可导入的网址。 */
function normalizeBookmarkUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    // 去除首尾空白后的书签地址
    const normalizedUrl = url.trim();
    // 用于校验协议的网址对象
    const parsedUrl = new URL(normalizedUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return undefined;
    }
    return normalizedUrl;
  } catch {
    return undefined;
  }
}

/** 为无标题书签生成可识别的标题。 */
function getBookmarkTitle(node: BrowserBookmarkNode, url: string): string {
  // 书签提供的标题
  const title = node.title.trim();
  if (title) {
    return title;
  }

  try {
    // 书签地址中的域名
    const hostname = new URL(url).hostname;
    return hostname || url;
  } catch {
    return url;
  }
}

/** 生成集合中不重复的导入分类名称。 */
function getUniqueCategoryName(
  baseName: string,
  usedNames: Set<string>,
  importSuffix: string
): string {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  // 重名分类的递增序号
  let nameIndex = 1;
  // 当前候选分类名称
  let candidateName = `${baseName} (${importSuffix})`;
  while (usedNames.has(candidateName)) {
    nameIndex += 1;
    candidateName = `${baseName} (${importSuffix} ${nameIndex})`;
  }
  usedNames.add(candidateName);
  return candidateName;
}

/** 生成单个导入分类中不重复的文件夹名称。 */
function getUniqueFolderName(
  baseName: string,
  usedNames: Set<string>
): string {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  // 重名文件夹的递增序号
  let nameIndex = 2;
  // 当前候选文件夹名称
  let candidateName = `${baseName} (${nameIndex})`;
  while (usedNames.has(candidateName)) {
    nameIndex += 1;
    candidateName = `${baseName} (${nameIndex})`;
  }
  usedNames.add(candidateName);
  return candidateName;
}

/** 将有效书签节点转换为网址并执行分类内去重。 */
function createImportLink(
  node: BrowserBookmarkNode,
  context: CategoryBuildContext,
  getParentId: () => string,
  sort: number
): Link | undefined {
  // 校验后的书签地址
  const url = normalizeBookmarkUrl(node.url);
  if (!url) {
    context.skipped.invalid += 1;
    return undefined;
  }
  if (context.seenUrls.has(url)) {
    context.skipped.duplicate += 1;
    return undefined;
  }
  context.seenUrls.add(url);

  // 浏览器缓存的首选网站图标
  const icon = getFaviconUrls(url)[0] ?? "";
  return {
    id: getUniqueId(),
    type: LinkType.LINK,
    sort,
    description: "",
    title: getBookmarkTitle(node, url),
    url,
    icon,
    parentId: getParentId(),
  };
}

/** 按源顺序将嵌套文件夹展平到分类。 */
function appendFolder(
  node: BrowserBookmarkNode,
  parentPath: string[],
  context: CategoryBuildContext
): void {
  // 当前文件夹的可展示名称
  const folderName = node.title.trim() || context.unnamedFolderName;
  // 当前文件夹的完整相对路径
  const folderPath = [...parentPath, folderName];
  // 当前文件夹首次产生有效直属网址时创建的目标文件夹
  let linkGroup: LinkGroup | undefined;
  // 当前文件夹内网址排序
  let linkSort = 0;

  /** 在首个有效直属网址出现时创建并返回目标文件夹标识。 */
  function getLinkGroupId(): string {
    if (!linkGroup) {
      // 路径展平后的唯一文件夹名称
      const uniqueFolderName = getUniqueFolderName(
        folderPath.join(" / "),
        context.usedFolderNames
      );
      linkGroup = {
        id: getUniqueId(),
        type: LinkType.LINK_GROUP,
        name: uniqueFolderName,
        sort: context.nextItemSort,
        description: "",
        parentId: context.categoryId,
      };
      context.linkGroups.push(linkGroup);
      context.nextItemSort += 1;
    }
    return linkGroup.id;
  }

  // 按浏览器书签原顺序遍历当前文件夹内容
  for (const childNode of node.children ?? []) {
    if (childNode.url !== undefined) {
      // 当前直属书签转换出的 LocalTab 网址
      const link = createImportLink(childNode, context, getLinkGroupId, linkSort);
      if (link) {
        context.links.push(link);
        linkSort += 1;
      }
      continue;
    }

    appendFolder(childNode, folderPath, context);
  }
}

/** 获取浏览器书签树中的顶层容器。 */
function getTopLevelContainers(tree: BrowserBookmarkNode[]): BrowserBookmarkNode[] {
  // 浏览器 API 通常返回的单一根节点
  const rootNode = tree.length === 1 && !tree[0].url ? tree[0] : undefined;
  return rootNode?.children ?? tree;
}

/** 将浏览器书签树转换为不覆盖现有数据的导入计划。 */
export function buildBookmarkImportPlan(
  tree: BrowserBookmarkNode[],
  options: BookmarkImportPlanOptions
): BookmarkImportPlan {
  // 已存在和本次计划使用的分类名称
  const usedCategoryNames = new Set(
    options.existingCategories.map((category) => category.name)
  );
  // 本次待创建的分类
  const categories: Category[] = [];
  // 本次待创建的文件夹
  const linkGroups: LinkGroup[] = [];
  // 本次待创建的网址
  const links: Link[] = [];
  // 本次转换跳过的项目统计
  const skipped: BookmarkImportSkippedSummary = {
    duplicate: 0,
    invalid: 0,
  };

  // 按浏览器顶层容器顺序创建导入分类
  for (const containerNode of getTopLevelContainers(tree)) {
    // 当前待导入分类标识
    const categoryId = getUniqueId();
    // 当前分类转换上下文
    const context: CategoryBuildContext = {
      categoryId,
      links: [],
      linkGroups: [],
      seenUrls: new Set<string>(),
      usedFolderNames: new Set<string>(),
      skipped,
      nextItemSort: 0,
      unnamedFolderName: options.unnamedFolderName,
    };

    // 按浏览器原顺序转换分类直属网址和嵌套文件夹
    for (const childNode of containerNode.children ?? []) {
      if (childNode.url !== undefined) {
        // 当前直属书签转换出的 LocalTab 网址
        const link = createImportLink(
          childNode,
          context,
          () => categoryId,
          context.nextItemSort
        );
        if (link) {
          context.links.push(link);
          context.nextItemSort += 1;
        }
        continue;
      }
      appendFolder(childNode, [], context);
    }

    if (context.links.length === 0) {
      continue;
    }

    // 当前容器的原始分类名称
    const baseCategoryName =
      containerNode.title.trim() || options.unnamedCategoryName;
    // 避免覆盖现有名称的新分类名称
    const categoryName = getUniqueCategoryName(
      baseCategoryName,
      usedCategoryNames,
      options.importSuffix
    );
    categories.push({
      id: categoryId,
      name: categoryName,
      icon: "folder",
      sort: options.existingCategories.length + categories.length,
    });
    linkGroups.push(...context.linkGroups);
    links.push(...context.links);
  }

  return { categories, linkGroups, links, skipped };
}

/** 汇总导入计划中的创建和跳过数量。 */
export function getBookmarkImportSummary(
  plan: BookmarkImportPlan
): BookmarkImportSummary {
  return {
    categoryCount: plan.categories.length,
    folderCount: plan.linkGroups.length,
    linkCount: plan.links.length,
    duplicateCount: plan.skipped.duplicate,
    invalidCount: plan.skipped.invalid,
  };
}

/** 编排书签树转换和原子追加持久化。 */
export class BookmarkImportService {
  /** 结合当前分类上下文构建不覆盖现有数据的导入计划。 */
  async createPlan(
    tree: BrowserBookmarkNode[],
    labels: BookmarkImportLabels
  ): Promise<BookmarkImportPlan> {
    // 当前已有的全部分类
    const existingCategories = await categoryService.getAllCategories();
    return buildBookmarkImportPlan(tree, {
      ...labels,
      existingCategories,
    });
  }

  /** 原子追加整个导入计划并返回实际写入统计。 */
  async commit(plan: BookmarkImportPlan): Promise<BookmarkImportSummary> {
    await db.appendAll({
      categories: plan.categories,
      links: plan.links,
      linkGroups: plan.linkGroups,
    });
    return getBookmarkImportSummary(plan);
  }
}

// 浏览器书签导入服务单例
export const bookmarkImportService = new BookmarkImportService();
