import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { categoryService } from "@/services/categoryService";
import { browserSearchService } from "@/services/browserSearchService";
import useSystemStore from "@/store/systemStore";
import { systemService } from "@/services/index";
import { categoryItemService } from "@/services/categoryItemService";
import { useWebActive } from "@/hooks/useWebActive";
import { toast } from "sonner";
import { useBackgroundImg } from "@/hooks/useBackgroundImg";
import defaultBackground from "@/assets/defaultBackground.jpg";
import { db } from "@/utils/db";
import { subscribeWorkspaceDataChanged } from "@/utils/broadcastSync";
import {
  applyDeleteCategory,
  applyDeleteLink,
  applyDeleteLinkGroup,
  applyMergeLinks,
  applyMoveCategoryItem,
  applyMoveLink,
  applyRenameLinkGroup,
  applyUpdateCategoryOrder,
} from "@/newtab/optimistic-categories";
import {
  DEFAULT_SEARCH_ENGINE_ID,
  LinkType,
  type Category,
  type CategoryGridItem,
  type CategoryInfo,
  type Link,
  type LinkGroup,
  type LinkGroupInfo,
} from "@/type/db";

/** 按 parentId 分组并按 sort 排序，避免 O(N^2) 重复扫描。 */
function groupByParentId<T extends { parentId: string; sort: number }>(
  records: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const record of records) {
    const list = grouped.get(record.parentId);
    if (list) {
      list.push(record);
    } else {
      grouped.set(record.parentId, [record]);
    }
  }
  for (const list of grouped.values()) {
    list.sort((first, second) => first.sort - second.sort);
  }
  return grouped;
}

/** 一次性从单事务读取全部分类、网址和文件夹并在内存中组装。 */
async function loadCategoriesData(): Promise<CategoryInfo[]> {
  const { categories, links, linkGroups } =
    await db.getAllWorkspaceData<Category, Link, LinkGroup>();

  categories.sort((first, second) => first.sort - second.sort);

  const linksByParentId = groupByParentId(links);
  const groupsByParentId = groupByParentId(linkGroups);

  // 收集历史数据尚未归一化排序的分类项，后续统一后台落盘
  const normalizedLinksToPersist: Link[] = [];
  const normalizedGroupsToPersist: LinkGroup[] = [];

  const result = categories.map((category): CategoryInfo => {
    const directLinks = linksByParentId.get(category.id) ?? [];
    const directGroups = groupsByParentId.get(category.id) ?? [];

    const sortedItems = [...directLinks, ...directGroups].sort(
      (firstItem, secondItem) => firstItem.sort - secondItem.sort
    );
    const isUnifiedOrder = sortedItems.every(
      (item, index) => item.sort === index
    );

    const orderedCategoryItems = isUnifiedOrder
      ? sortedItems
      : [...directLinks, ...directGroups].map((item, index) => {
          const normalized = { ...item, parentId: category.id, sort: index };
          if (item.parentId !== category.id || item.sort !== index) {
            if (normalized.type === LinkType.LINK_GROUP) {
              normalizedGroupsToPersist.push(normalized);
            } else {
              normalizedLinksToPersist.push(normalized);
            }
          }
          return normalized;
        });

    const normalizedDirectLinks = orderedCategoryItems.filter(
      (item): item is Link => item.type === LinkType.LINK
    );
    const normalizedDirectGroups = orderedCategoryItems.filter(
      (item): item is LinkGroup => item.type === LinkType.LINK_GROUP
    );

    const linkGroupInfos: LinkGroupInfo[] = normalizedDirectGroups.map(
      (linkGroup) => ({
        ...linkGroup,
        links: linksByParentId.get(linkGroup.id) ?? [],
      })
    );
    const linkGroupInfoMap = new Map(
      linkGroupInfos.map((linkGroup) => [linkGroup.id, linkGroup])
    );

    const items: CategoryGridItem[] = orderedCategoryItems.map((item) => {
      if (item.type === LinkType.LINK_GROUP) {
        return linkGroupInfoMap.get(item.id)!;
      }
      return item;
    });

    return {
      ...category,
      links: normalizedDirectLinks,
      linkGroups: linkGroupInfos,
      items,
    };
  });

  if (
    normalizedLinksToPersist.length > 0 ||
    normalizedGroupsToPersist.length > 0
  ) {
    void db.putCategoryItems(
      normalizedLinksToPersist,
      normalizedGroupsToPersist
    );
  }

  return result;
}

/**
 * 管理新标签页的初始化、页面数据、跨标签同步和乐观交互更新。
 */
export function useData() {
  // 国际化工具
  const { t } = useTranslation();
  // 页面激活状态
  const { isWebActive, onChangeWebActive } = useWebActive();
  // 背景图片状态
  const { onLoadBackground, backgroundImage } = useBackgroundImg();
  // 数据库初始化状态更新器
  const changeIsInitializedDB = useSystemStore(
    (state) => state.changeIsInitializedDB
  );
  // 当前分类标识
  const [currentCategoryId, setCurrentCategoryId] = useState<string>("");
  // 分类及链接数据
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  // 供乐观操作读取最新状态的同步引用
  const categoriesRef = useRef<CategoryInfo[]>([]);
  const currentCategoryIdRef = useRef<string>("");
  useEffect(() => {
    categoriesRef.current = categories;
    currentCategoryIdRef.current = currentCategoryId;
  }, [categories, currentCategoryId]);

  // 背景图片初始化状态
  const isInitializedBackgroundImage = useSystemStore(
    (state) => state.isInitializedBackgroundImage
  );
  // 当前搜索引擎更新器
  const changeSelectedSearchEngineId = useSystemStore(
    (state) => state.changeSelectedSearchEngineId
  );
  // 自定义搜索引擎更新器
  const changeCustomSearchEngines = useSystemStore(
    (state) => state.changeCustomSearchEngines
  );

  /* 背景样式 */
  const backgroundStyle = useMemo(() => {
    return {
      background: isInitializedBackgroundImage
        ? backgroundImage
          ? `url(${backgroundImage}) center/cover no-repeat`
          : `url(${defaultBackground}) center/cover no-repeat`
        : "rgb(0, 0, 0,0.8)",
    };
  }, [isInitializedBackgroundImage, backgroundImage]);

  /** 刷新全部分类及网址数据。 */
  const refreshCategoriesData = useCallback(async () => {
    // 组合链接和分组后的分类数据
    const result = await loadCategoriesData();
    const activeId = currentCategoryIdRef.current;

    // 第一个分类
    const firstCategory = result[0];
    if (firstCategory) {
      if (!activeId) {
        setCurrentCategoryId(firstCategory.id);
      } else {
        const findCategory = result.find(
          (category) => category.id === activeId
        );
        if (!findCategory) {
          setCurrentCategoryId(firstCategory.id);
        }
      }
    }

    setCategories(result);
  }, []);

  /** 切换当前分类。 */
  const changeCurrentCategory = useCallback((categoryId: string) => {
    setCurrentCategoryId(categoryId);
  }, []);

  /** 刷新搜索引擎设置。 */
  const refreshSearchEngine = useCallback(async () => {
    // 并行加载当前选项和自定义搜索引擎
    const [selectedSearchEngineId, customSearchEngines] = await Promise.all([
      systemService.getSelectedSearchEngineId(),
      systemService.getCustomSearchEngines(),
    ]);
    // 浏览器默认搜索支持状态
    const isDefaultSearchSupported =
      browserSearchService.isDefaultSearchSupported();
    // 当前选项是否仍然可用
    const isSelectedEngineValid =
      (isDefaultSearchSupported &&
        selectedSearchEngineId === DEFAULT_SEARCH_ENGINE_ID) ||
      customSearchEngines.some(
        (searchEngine) => searchEngine.id === selectedSearchEngineId
      );
    // 校验后的搜索引擎标识
    const validSearchEngineId = isSelectedEngineValid
      ? selectedSearchEngineId
      : customSearchEngines[0]?.id ?? DEFAULT_SEARCH_ENGINE_ID;

    changeCustomSearchEngines(customSearchEngines);
    changeSelectedSearchEngineId(validSearchEngineId);
    if (!isSelectedEngineValid) {
      await systemService.updateSelectedSearchEngineId(validSearchEngineId);
    }
  }, [changeCustomSearchEngines, changeSelectedSearchEngineId]);

  /** 乐观更新分类排序并异步写入数据库。 */
  const updateCategoryOrder = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      const previousCategories = categoriesRef.current;
      setCategories(
        applyUpdateCategoryOrder(previousCategories, dragIndex, hoverIndex)
      );
      toast.success(t("category.sortSuccess"));
      try {
        await categoryService.updateCategoryOrder(dragIndex, hoverIndex);
      } catch (error) {
        console.error("更新分类排序失败:", error);
        setCategories(previousCategories);
        await refreshCategoriesData();
      }
    },
    [refreshCategoriesData, t]
  );

  /** 乐观移动网址并异步写入数据库，消除松手瞬间回弹闪烁。 */
  const moveLink = useCallback(
    async (linkId: string, targetParentId: string, targetIndex: number) => {
      const previousCategories = categoriesRef.current;
      const {
        nextCategories,
        sourceParentId,
        sourceIndex,
        targetCategoryId,
      } = applyMoveLink(
        previousCategories,
        linkId,
        targetParentId,
        targetIndex
      );

      setCategories(nextCategories);
      if (targetCategoryId) {
        setCurrentCategoryId(targetCategoryId);
      }

      if (sourceParentId !== targetParentId) {
        toast.success(t("link.movedSuccess"));
      } else if (sourceIndex !== targetIndex) {
        toast.success(t("link.sortSuccess"));
      }

      try {
        await categoryItemService.moveLink(linkId, targetParentId, targetIndex);
      } catch (error) {
        console.error("移动网址失败:", error);
        setCategories(previousCategories);
        await refreshCategoriesData();
      }
    },
    [refreshCategoriesData, t]
  );

  /** 乐观将两个未分组网址合并为自动命名的新文件夹，落盘后同步真实文件夹 ID。 */
  const mergeLinks = useCallback(
    async (categoryId: string, targetLinkId: string, draggedLinkId: string) => {
      const previousCategories = categoriesRef.current;
      const category = previousCategories.find(
        (item) => item.id === categoryId
      );
      if (!category) {
        return;
      }

      // 自动分组名称的递增序号
      let groupNameIndex = 1;
      // 当前序号对应的本地化分组名称
      let groupName = t("linkGroup.defaultName", { index: groupNameIndex });
      while (
        category.linkGroups.some((linkGroup) => linkGroup.name === groupName)
      ) {
        groupNameIndex += 1;
        groupName = t("linkGroup.defaultName", { index: groupNameIndex });
      }

      const tempGroupId = `optimistic-group-${Date.now()}`;
      setCategories(
        applyMergeLinks(
          previousCategories,
          categoryId,
          targetLinkId,
          draggedLinkId,
          groupName,
          tempGroupId
        )
      );
      setCurrentCategoryId(categoryId);
      toast.success(t("linkGroup.createSuccess"));

      try {
        await categoryItemService.mergeLinksIntoFolder(
          categoryId,
          targetLinkId,
          draggedLinkId,
          groupName
        );
        await refreshCategoriesData();
      } catch (error) {
        console.error("合并网址失败:", error);
        setCategories(previousCategories);
        await refreshCategoriesData();
      }
    },
    [refreshCategoriesData, t]
  );

  /** 乐观调整分类网格中的网址或文件夹顺序，并异步持久化。 */
  const moveCategoryItem = useCallback(
    async (categoryId: string, itemId: string, targetIndex: number) => {
      const previousCategories = categoriesRef.current;
      setCategories(
        applyMoveCategoryItem(
          previousCategories,
          categoryId,
          itemId,
          targetIndex
        )
      );
      toast.success(t("linkGroup.sortSuccess"));

      try {
        await categoryItemService.moveCategoryItem(
          categoryId,
          itemId,
          targetIndex
        );
      } catch (error) {
        console.error("调整分类项目顺序失败:", error);
        setCategories(previousCategories);
        await refreshCategoriesData();
      }
    },
    [refreshCategoriesData, t]
  );

  /** 乐观重命名文件夹。 */
  const optimisticRenameLinkGroup = useCallback(
    (linkGroupId: string, name: string) => {
      setCategories((prev) => applyRenameLinkGroup(prev, linkGroupId, name));
    },
    []
  );

  /** 乐观删除网址。 */
  const optimisticDeleteLink = useCallback((linkId: string) => {
    setCategories((prev) => applyDeleteLink(prev, linkId));
  }, []);

  /** 乐观删除文件夹。 */
  const optimisticDeleteLinkGroup = useCallback((linkGroupId: string) => {
    setCategories((prev) => applyDeleteLinkGroup(prev, linkGroupId));
  }, []);

  /** 乐观删除分类并在必要时切换当前分类。 */
  const optimisticDeleteCategory = useCallback((categoryId: string) => {
    setCategories((prev) => {
      const next = applyDeleteCategory(prev, categoryId);
      if (currentCategoryIdRef.current === categoryId && next[0]) {
        setCurrentCategoryId(next[0].id);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    /**
     * 初始化新标签页数据。
     */
    const init = async () => {
      await systemService.init();
      await categoryService.init(i18n.t("category.defaultHome"));
      changeIsInitializedDB(true);

      // 初始化后的全部分类页面数据
      const loadedCategories = await loadCategoriesData();
      // 默认选中的首个分类
      const firstCategory = loadedCategories[0];

      setCategories(loadedCategories);
      if (firstCategory) {
        setCurrentCategoryId(firstCategory.id);
      }
    };
    void init();
  }, [changeIsInitializedDB]);

  // 监听标签页重新可见，并发刷新各类状态
  useEffect(() => {
    if (!isWebActive) {
      return;
    }

    const refresh = async () => {
      await Promise.all([
        refreshCategoriesData(),
        onLoadBackground(),
        refreshSearchEngine(),
      ]);
      onChangeWebActive(false);
    };

    void refresh();
  }, [
    isWebActive,
    onChangeWebActive,
    onLoadBackground,
    refreshCategoriesData,
    refreshSearchEngine,
  ]);

  // 订阅其他标签页或弹窗触发的实时变更广播
  useEffect(() => {
    return subscribeWorkspaceDataChanged((scope) => {
      if (scope === "workspace") {
        void refreshCategoriesData();
      } else if (scope === "wallpaper") {
        void onLoadBackground();
      } else if (scope === "search") {
        void refreshSearchEngine();
      } else {
        void Promise.all([
          refreshCategoriesData(),
          onLoadBackground(),
          refreshSearchEngine(),
        ]);
      }
    });
  }, [onLoadBackground, refreshCategoriesData, refreshSearchEngine]);

  return {
    currentCategoryId,
    categories,
    backgroundStyle,
    changeCurrentCategory,
    refreshCategoriesData,
    updateCategoryOrder,
    moveLink,
    mergeLinks,
    moveCategoryItem,
    optimisticRenameLinkGroup,
    optimisticDeleteLink,
    optimisticDeleteLinkGroup,
    optimisticDeleteCategory,
  };
}
