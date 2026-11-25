import {
  LinkType,
  type CategoryGridItem,
  type CategoryInfo,
  type Link,
  type LinkGroupInfo,
} from "@/type/db";

/** 根据重排后的混排 items 同步刷新分类的 links、linkGroups 与排序号。 */
function rebuildCategory(
  category: CategoryInfo,
  items: CategoryGridItem[]
): CategoryInfo {
  const normalizedItems: CategoryGridItem[] = items.map((item, index) => {
    if (item.type === LinkType.LINK_GROUP) {
      return {
        ...item,
        parentId: category.id,
        sort: index,
        links: item.links.map((link, linkIndex) => ({
          ...link,
          parentId: item.id,
          sort: linkIndex,
        })),
      };
    }
    return {
      ...item,
      parentId: category.id,
      sort: index,
    };
  });

  const links = normalizedItems.filter(
    (item): item is Link => item.type === LinkType.LINK
  );
  const linkGroups = normalizedItems.filter(
    (item): item is LinkGroupInfo => item.type === LinkType.LINK_GROUP
  );

  return {
    ...category,
    items: normalizedItems,
    links,
    linkGroups,
  };
}

/** 若分类中存在仅剩 1 个网址的文件夹，则在原位置展开解散该文件夹。 */
function dissolveSingleLinkFolders(category: CategoryInfo): CategoryInfo {
  let hasDissolved = false;
  const nextItems = category.items.flatMap((item) => {
    if (item.type === LinkType.LINK_GROUP && item.links.length === 1) {
      hasDissolved = true;
      return [{ ...item.links[0], parentId: category.id }];
    }
    return [item];
  });
  return hasDissolved ? rebuildCategory(category, nextItems) : category;
}

/** 在全部分类中定位指定网址及其所属父级信息。 */
function findLinkLocation(
  categories: CategoryInfo[],
  linkId: string
): {
  link: Link;
  sourceCategoryId: string;
  sourceParentId: string;
  sourceIndex: number;
} | null {
  for (const category of categories) {
    const directIndex = category.links.findIndex((link) => link.id === linkId);
    if (directIndex >= 0) {
      return {
        link: category.links[directIndex],
        sourceCategoryId: category.id,
        sourceParentId: category.id,
        sourceIndex: directIndex,
      };
    }
    for (const linkGroup of category.linkGroups) {
      const groupedIndex = linkGroup.links.findIndex(
        (link) => link.id === linkId
      );
      if (groupedIndex >= 0) {
        return {
          link: linkGroup.links[groupedIndex],
          sourceCategoryId: category.id,
          sourceParentId: linkGroup.id,
          sourceIndex: groupedIndex,
        };
      }
    }
  }
  return null;
}

/** 从分类状态中移除指定网址并处理单网址文件夹的自动解散。 */
function removeLinkFromCategories(
  categories: CategoryInfo[],
  linkId: string
): CategoryInfo[] {
  return categories.map((category) => {
    const hasDirectLink = category.items.some(
      (item) => item.type === LinkType.LINK && item.id === linkId
    );
    const hasGroupedLink = category.items.some(
      (item) =>
        item.type === LinkType.LINK_GROUP &&
        item.links.some((link) => link.id === linkId)
    );

    if (!hasDirectLink && !hasGroupedLink) {
      return category;
    }

    const filteredItems = category.items.flatMap<CategoryGridItem>((item) => {
      if (item.type === LinkType.LINK) {
        return item.id === linkId ? [] : [item];
      }
      if (!item.links.some((link) => link.id === linkId)) {
        return [item];
      }
      return [
        {
          ...item,
          links: item.links.filter((link) => link.id !== linkId),
        },
      ];
    });

    return dissolveSingleLinkFolders(rebuildCategory(category, filteredItems));
  });
}

/** 乐观更新分类排序。 */
export function applyUpdateCategoryOrder(
  categories: CategoryInfo[],
  dragIndex: number,
  hoverIndex: number
): CategoryInfo[] {
  if (
    dragIndex === hoverIndex ||
    dragIndex < 0 ||
    dragIndex >= categories.length ||
    hoverIndex < 0 ||
    hoverIndex >= categories.length
  ) {
    return categories;
  }

  const nextCategories = [...categories];
  const [draggedCategory] = nextCategories.splice(dragIndex, 1);
  nextCategories.splice(hoverIndex, 0, draggedCategory);
  return nextCategories.map((category, index) => ({
    ...category,
    sort: index,
  }));
}

/** 乐观更新分类主网格中网址或文件夹的排序与跨区移动。 */
export function applyMoveCategoryItem(
  categories: CategoryInfo[],
  categoryId: string,
  itemId: string,
  targetIndex: number
): CategoryInfo[] {
  let draggedItem: CategoryGridItem | undefined;
  let sourceCategoryId = "";

  for (const category of categories) {
    const found = category.items.find((item) => item.id === itemId);
    if (found) {
      draggedItem = found;
      sourceCategoryId = category.id;
      break;
    }
  }

  if (!draggedItem) {
    return categories;
  }

  return categories.map((category) => {
    if (category.id === sourceCategoryId && category.id === categoryId) {
      const remainingItems = category.items.filter(
        (item) => item.id !== itemId
      );
      const insertIndex = Math.max(
        0,
        Math.min(targetIndex, remainingItems.length)
      );
      remainingItems.splice(insertIndex, 0, draggedItem!);
      return rebuildCategory(category, remainingItems);
    }

    if (category.id === sourceCategoryId) {
      return rebuildCategory(
        category,
        category.items.filter((item) => item.id !== itemId)
      );
    }

    if (category.id === categoryId) {
      const remainingItems = category.items.filter(
        (item) => item.id !== itemId
      );
      const insertIndex = Math.max(
        0,
        Math.min(targetIndex, remainingItems.length)
      );
      remainingItems.splice(insertIndex, 0, {
        ...draggedItem!,
        parentId: categoryId,
      });
      return rebuildCategory(category, remainingItems);
    }

    return category;
  });
}

/** 乐观更新网址移动（支持同分类排序、跨分类、进出文件夹及单网址文件夹解散）。 */
export function applyMoveLink(
  categories: CategoryInfo[],
  linkId: string,
  targetParentId: string,
  targetIndex: number
): {
  nextCategories: CategoryInfo[];
  sourceParentId?: string;
  sourceIndex?: number;
  targetCategoryId?: string;
} {
  const location = findLinkLocation(categories, linkId);
  if (!location) {
    return { nextCategories: categories };
  }

  const targetCategory = categories.find(
    (category) =>
      category.id === targetParentId ||
      category.linkGroups.some((linkGroup) => linkGroup.id === targetParentId)
  );
  if (!targetCategory) {
    return { nextCategories: categories };
  }

  // 判断是否为移动到分类主网格
  const isTargetCategory = targetCategory.id === targetParentId;
  // 先在原位置移除并处理原文件夹可能的解散
  const categoriesAfterRemoval = removeLinkFromCategories(categories, linkId);

  const nextCategories = categoriesAfterRemoval.map((category) => {
    if (category.id !== targetCategory.id) {
      return category;
    }

    if (isTargetCategory) {
      const remainingItems = [...category.items];
      const insertIndex = Math.max(
        0,
        Math.min(targetIndex, remainingItems.length)
      );
      remainingItems.splice(insertIndex, 0, {
        ...location.link,
        parentId: targetParentId,
      });
      return rebuildCategory(category, remainingItems);
    }

    const nextItems = category.items.map((item) => {
      if (item.type !== LinkType.LINK_GROUP || item.id !== targetParentId) {
        return item;
      }
      const nextLinks = [...item.links];
      const insertIndex = Math.max(
        0,
        Math.min(targetIndex, nextLinks.length)
      );
      nextLinks.splice(insertIndex, 0, {
        ...location.link,
        parentId: targetParentId,
      });
      return {
        ...item,
        links: nextLinks,
      };
    });
    return rebuildCategory(category, nextItems);
  });

  return {
    nextCategories,
    sourceParentId: location.sourceParentId,
    sourceIndex: location.sourceIndex,
    targetCategoryId: targetCategory.id,
  };
}

/** 乐观合并两个网址为新建文件夹。 */
export function applyMergeLinks(
  categories: CategoryInfo[],
  categoryId: string,
  targetLinkId: string,
  draggedLinkId: string,
  groupName: string,
  tempGroupId: string
): CategoryInfo[] {
  const draggedLocation = findLinkLocation(categories, draggedLinkId);
  const targetCategory = categories.find((item) => item.id === categoryId);
  const targetItem = targetCategory?.items.find(
    (item): item is Link =>
      item.type === LinkType.LINK && item.id === targetLinkId
  );

  if (!draggedLocation || !targetItem) {
    return categories;
  }

  const categoriesAfterRemoval = removeLinkFromCategories(
    categories,
    draggedLinkId
  );

  return categoriesAfterRemoval.map((category) => {
    if (category.id !== categoryId) {
      return category;
    }
    const newFolder: LinkGroupInfo = {
      id: tempGroupId,
      type: LinkType.LINK_GROUP,
      name: groupName,
      sort: targetItem.sort,
      description: "",
      parentId: categoryId,
      links: [
        { ...targetItem, parentId: tempGroupId, sort: 0 },
        { ...draggedLocation.link, parentId: tempGroupId, sort: 1 },
      ],
    };

    const mergedItems = category.items.flatMap((item) => {
      if (item.id === targetLinkId) {
        return [newFolder];
      }
      return item.id === draggedLinkId ? [] : [item];
    });
    return rebuildCategory(category, mergedItems);
  });
}

/** 乐观重命名文件夹。 */
export function applyRenameLinkGroup(
  categories: CategoryInfo[],
  linkGroupId: string,
  name: string
): CategoryInfo[] {
  return categories.map((category) => {
    if (!category.linkGroups.some((group) => group.id === linkGroupId)) {
      return category;
    }
    const nextItems = category.items.map((item) =>
      item.type === LinkType.LINK_GROUP && item.id === linkGroupId
        ? { ...item, name }
        : item
    );
    return rebuildCategory(category, nextItems);
  });
}

/** 乐观删除指定网址。 */
export function applyDeleteLink(
  categories: CategoryInfo[],
  linkId: string
): CategoryInfo[] {
  return removeLinkFromCategories(categories, linkId);
}

/** 乐观删除文件夹并在原位置展开内部网址。 */
export function applyDeleteLinkGroup(
  categories: CategoryInfo[],
  linkGroupId: string
): CategoryInfo[] {
  return categories.map((category) => {
    if (!category.linkGroups.some((group) => group.id === linkGroupId)) {
      return category;
    }
    const nextItems = category.items.flatMap((item) => {
      if (item.type === LinkType.LINK_GROUP && item.id === linkGroupId) {
        return item.links.map((link) => ({
          ...link,
          parentId: category.id,
        }));
      }
      return [item];
    });
    return rebuildCategory(category, nextItems);
  });
}

/** 乐观删除指定分类。 */
export function applyDeleteCategory(
  categories: CategoryInfo[],
  categoryId: string
): CategoryInfo[] {
  return categories
    .filter((category) => category.id !== categoryId)
    .map((category, index) => ({
      ...category,
      sort: index,
    }));
}
