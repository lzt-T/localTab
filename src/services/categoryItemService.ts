import { db, STORE_NAMES } from "@/utils/db";
import {
  LinkType,
  type CategoryItem,
  type Link,
  type LinkGroup,
} from "@/type/db";
import { linkService } from "@/services/linkService";
import { linkGroupService } from "@/services/linkGroupService";

/** 管理分类直属网址与文件夹的统一顺序。 */
export class CategoryItemService {
  /** 创建网址并保持分类主网格的既有混排顺序。 */
  async createLink(linkData: Partial<Link>): Promise<Link> {
    // 新网址目标父级对应的文件夹
    const targetLinkGroup = await linkGroupService.getLinkGroup(
      linkData.parentId ?? ""
    );
    // 新建前的分类混排项目
    const categoryItems = targetLinkGroup
      ? []
      : await this.getCategoryItems(linkData.parentId ?? "");
    // 已保存的新网址
    const createdLink = await linkService.updateLink(linkData);
    if (!targetLinkGroup) {
      await this.saveCategoryItemOrder(
        [...categoryItems, createdLink],
        createdLink.parentId
      );
    }
    return createdLink;
  }

  /** 创建空文件夹并将其追加到分类主网格末尾。 */
  async createFolder(name: string, categoryId: string): Promise<LinkGroup> {
    // 新建前的分类混排项目
    const categoryItems = await this.getCategoryItems(categoryId);
    // 已保存的空文件夹
    const createdFolder = await linkGroupService.createLinkGroup(
      name,
      categoryId
    );
    await this.saveCategoryItemOrder(
      [...categoryItems, createdFolder],
      categoryId
    );
    return createdFolder;
  }

  /** 获取并按需归一化分类网格项目。 */
  async getCategoryItems(categoryId: string): Promise<CategoryItem[]> {
    // 分类直属网址和文件夹
    const [links, linkGroups] = await Promise.all([
      linkService.getLinkCountByParentId(categoryId),
      linkGroupService.getLinkGroupsByParentId(categoryId),
    ]);
    // 按现有序号排列的分类项目
    const sortedItems = [...links, ...linkGroups].sort(
      (firstItem, secondItem) => firstItem.sort - secondItem.sort
    );
    // 当前序号是否已形成唯一连续的混排顺序
    const isUnifiedOrder = sortedItems.every(
      (item, index) => item.sort === index
    );
    if (isUnifiedOrder) {
      return sortedItems;
    }

    // 旧数据先保留直属网址顺序，再接续原文件夹顺序
    const legacyItems: CategoryItem[] = [...links, ...linkGroups];
    return await this.saveCategoryItemOrder(legacyItems, categoryId);
  }

  /** 检查分类直属网址及文件夹内网址是否包含完整地址。 */
  async hasCategoryLinkUrl(categoryId: string, url: string): Promise<boolean> {
    // 分类内的网址分组和全部网址
    const [linkGroups, links] = await Promise.all([
      linkGroupService.getLinkGroupsByParentId(categoryId),
      linkService.getAllLinks(),
    ]);
    // 当前分类范围内允许的网址父级标识
    const parentIds = new Set([
      categoryId,
      ...linkGroups.map((linkGroup) => linkGroup.id),
    ]);
    return links.some(
      (link) => parentIds.has(link.parentId) && link.url === url
    );
  }

  /** 将网址或文件夹移动到分类网格的指定位置。 */
  async moveCategoryItem(
    categoryId: string,
    itemId: string,
    targetIndex: number
  ): Promise<void> {
    // 目标分类当前的混排项目
    const categoryItems = await this.getCategoryItems(categoryId);
    // 待移动的分类项目或跨区文件夹
    const draggedItem =
      categoryItems.find((item) => item.id === itemId) ??
      (await linkGroupService.getLinkGroup(itemId));
    if (!draggedItem) {
      return;
    }
    // 跨区移动前的来源分类标识
    const sourceCategoryId =
      draggedItem.parentId === categoryId ? "" : draggedItem.parentId;
    // 跨区移动前的来源分类项目
    const sourceItems = sourceCategoryId
      ? await this.getCategoryItems(sourceCategoryId)
      : [];
    // 移除待移动项目后的目标分类项目
    const remainingItems = categoryItems.filter((item) => item.id !== itemId);
    // 限制在网格范围内的目标位置
    const insertIndex = Math.max(
      0,
      Math.min(targetIndex, remainingItems.length)
    );
    remainingItems.splice(insertIndex, 0, {
      ...draggedItem,
      parentId: categoryId,
    });
    await this.saveCategoryItemOrder(remainingItems, categoryId);
    if (sourceCategoryId) {
      await this.saveCategoryItemOrder(
        sourceItems.filter((item) => item.id !== itemId),
        sourceCategoryId
      );
    }
  }

  /** 将网址移动到分类网格或文件夹。 */
  async moveLink(
    linkId: string,
    targetParentId: string,
    targetIndex: number
  ): Promise<void> {
    // 目标父级对应的文件夹
    const targetLinkGroup = await linkGroupService.getLinkGroup(targetParentId);
    // 网址移动策略表
    const moveStrategies = {
      [LinkType.LINK_GROUP]: () =>
        this.moveLinkToFolder(linkId, targetParentId, targetIndex),
      [LinkType.LINK]: () =>
        this.moveLinkToCategory(linkId, targetParentId, targetIndex),
    };
    await moveStrategies[
      targetLinkGroup ? LinkType.LINK_GROUP : LinkType.LINK
    ]();
  }

  /** 将目标直属网址与拖入网址合并为文件夹。 */
  async mergeLinksIntoFolder(
    categoryId: string,
    targetLinkId: string,
    draggedLinkId: string,
    name: string
  ): Promise<void> {
    // 待拖入新文件夹的网址
    const draggedLink = await linkService.getLink(draggedLinkId);
    if (!draggedLink) {
      return;
    }
    // 拖入网址原父级对应的文件夹
    const sourceLinkGroup = await linkGroupService.getLinkGroup(
      draggedLink.parentId
    );
    // 跨分类直属网址原所属的分类标识
    const sourceCategoryId =
      !sourceLinkGroup && draggedLink.parentId !== categoryId
        ? draggedLink.parentId
        : "";
    // 跨分类合并前的来源分类项目
    const sourceItems = sourceCategoryId
      ? await this.getCategoryItems(sourceCategoryId)
      : [];
    // 分类当前的混排项目
    const categoryItems = await this.getCategoryItems(categoryId);
    // 新创建的文件夹
    const linkGroup = await linkGroupService.createLinkGroup(name, categoryId);
    await linkService.moveLink(targetLinkId, linkGroup.id, 0);
    await linkService.moveLink(draggedLinkId, linkGroup.id, 1);

    // 用新文件夹替换目标网址并移除拖入网址
    const mergedItems = categoryItems.flatMap((item) => {
      if (item.id === targetLinkId) {
        return [linkGroup];
      }
      return item.id === draggedLinkId ? [] : [item];
    });
    await this.saveCategoryItemOrder(mergedItems, categoryId);
    if (sourceCategoryId) {
      await this.saveCategoryItemOrder(
        sourceItems.filter((item) => item.id !== draggedLinkId),
        sourceCategoryId
      );
    }
    await this.dissolveSingleLinkFolder(sourceLinkGroup);
  }

  /** 删除文件夹并在原位置展开组内网址。 */
  async deleteFolder(id: string): Promise<void> {
    // 待删除的文件夹
    const linkGroup = await linkGroupService.getLinkGroup(id);
    if (!linkGroup) {
      return;
    }
    // 文件夹内部网址
    const groupedLinks = await linkService.getLinkCountByParentId(id);
    // 分类当前的混排项目
    const categoryItems = await this.getCategoryItems(linkGroup.parentId);
    // 分类当前直属网址数量
    const categoryLinks = await linkService.getLinkCountByParentId(
      linkGroup.parentId
    );

    for (let index = 0; index < groupedLinks.length; index++) {
      await linkService.moveLink(
        groupedLinks[index].id,
        linkGroup.parentId,
        categoryLinks.length + index
      );
    }
    await db.delete(STORE_NAMES.LINK_GROUP, id);

    // 用组内网址替换文件夹所在位置
    const expandedItems = categoryItems.flatMap((item) => {
      if (item.id !== id) {
        return [item];
      }
      return groupedLinks.map((link) => ({
        ...link,
        parentId: linkGroup.parentId,
      }));
    });
    await this.saveCategoryItemOrder(expandedItems, linkGroup.parentId);
  }

  /** 删除网址并保持所属列表顺序连续。 */
  async deleteLink(id: string): Promise<void> {
    // 待删除的网址
    const link = await linkService.getLink(id);
    if (!link) {
      return;
    }
    // 网址当前所属的文件夹
    const linkGroup = await linkGroupService.getLinkGroup(link.parentId);
    if (linkGroup) {
      await linkService.deleteLink(id);
      await this.dissolveSingleLinkFolder(linkGroup);
      return;
    }

    // 删除网址前的分类混排项目
    const categoryItems = await this.getCategoryItems(link.parentId);
    await linkService.deleteLink(id, false);
    await this.saveCategoryItemOrder(
      categoryItems.filter((item) => item.id !== id),
      link.parentId
    );
  }

  /** 解散操作后仅剩一个网址的文件夹。 */
  private async dissolveSingleLinkFolder(
    linkGroup: LinkGroup | undefined
  ): Promise<void> {
    if (!linkGroup) {
      return;
    }
    // 文件夹操作后剩余的网址
    const remainingLinks = await linkService.getLinkCountByParentId(
      linkGroup.id
    );
    if (remainingLinks.length !== 1) {
      return;
    }
    await this.deleteFolder(linkGroup.id);
  }

  /** 将网址移动到分类主网格。 */
  private async moveLinkToCategory(
    linkId: string,
    categoryId: string,
    targetIndex: number
  ): Promise<void> {
    // 待移动的网址
    const link = await linkService.getLink(linkId);
    if (!link) {
      return;
    }
    // 原父级对应的文件夹
    const sourceLinkGroup = await linkGroupService.getLinkGroup(link.parentId);
    // 跨分类移动时的原分类标识
    const sourceCategoryId =
      !sourceLinkGroup && link.parentId !== categoryId ? link.parentId : "";
    // 移动前的原分类混排项目
    const sourceItems = sourceCategoryId
      ? await this.getCategoryItems(sourceCategoryId)
      : [];
    // 目标分类当前的混排项目
    const categoryItems = await this.getCategoryItems(categoryId);
    // 移除同一网址后的目标分类项目
    const remainingItems = categoryItems.filter((item) => item.id !== linkId);
    // 限制在网格范围内的目标位置
    const insertIndex = Math.max(
      0,
      Math.min(targetIndex, remainingItems.length)
    );
    // 移动后的分类直属网址
    const movedLink: Link = { ...link, parentId: categoryId };
    remainingItems.splice(insertIndex, 0, movedLink);

    if (link.parentId !== categoryId) {
      // 目标分类当前的直属网址
      const targetLinks = await linkService.getLinkCountByParentId(categoryId);
      await linkService.moveLink(linkId, categoryId, targetLinks.length);
    }
    if (sourceCategoryId) {
      await this.saveCategoryItemOrder(
        sourceItems.filter((item) => item.id !== linkId),
        sourceCategoryId
      );
    }
    await this.saveCategoryItemOrder(remainingItems, categoryId);
    await this.dissolveSingleLinkFolder(sourceLinkGroup);
  }

  /** 将网址移动到目标文件夹。 */
  private async moveLinkToFolder(
    linkId: string,
    linkGroupId: string,
    targetIndex: number
  ): Promise<void> {
    // 待移动的网址
    const link = await linkService.getLink(linkId);
    if (!link) {
      return;
    }
    // 原父级对应的文件夹
    const sourceLinkGroup = await linkGroupService.getLinkGroup(link.parentId);
    // 网址原来直属的分类标识
    const sourceCategoryId = sourceLinkGroup ? "" : link.parentId;
    // 移动前的分类混排项目
    const sourceItems = sourceCategoryId
      ? await this.getCategoryItems(sourceCategoryId)
      : [];

    await linkService.moveLink(linkId, linkGroupId, targetIndex);
    if (sourceCategoryId) {
      await this.saveCategoryItemOrder(
        sourceItems.filter((item) => item.id !== linkId),
        sourceCategoryId
      );
    }
    await this.dissolveSingleLinkFolder(sourceLinkGroup);
  }

  /** 按数组顺序保存分类直属网址和文件夹。 */
  private async saveCategoryItemOrder(
    categoryItems: CategoryItem[],
    categoryId: string
  ): Promise<CategoryItem[]> {
    // 保存后包含最新父级和序号的分类项目
    const savedItems: CategoryItem[] = [];
    for (let index = 0; index < categoryItems.length; index++) {
      // 当前网格位置对应的分类项目
      const item = categoryItems[index];
      if (item.type === LinkType.LINK_GROUP) {
        // 待保存的文件夹数据
        const savedLinkGroup: LinkGroup = {
          ...item,
          parentId: categoryId,
          sort: index,
        };
        await db.put(STORE_NAMES.LINK_GROUP, savedLinkGroup);
        savedItems.push(savedLinkGroup);
      } else {
        // 待保存的分类直属网址
        const savedLink: Link = {
          ...item,
          parentId: categoryId,
          sort: index,
        };
        await db.put(STORE_NAMES.LINK, savedLink);
        savedItems.push(savedLink);
      }
    }
    return savedItems;
  }
}

// 分类网格项目服务单例
export const categoryItemService = new CategoryItemService();
