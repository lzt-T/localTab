import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { categoryService } from "@/services/categoryService";
import { browserSearchService } from "@/services/browserSearchService";
import useSystemStore from "@/store/systemStore";
import { linkService, systemService } from "@/services/index";
import { categoryItemService } from "@/services/categoryItemService";
import { useWebActive } from "@/hooks/useWebActive";
import { toast } from "sonner";
import { useBackgroundImg } from "@/hooks/useBackgroundImg";
import defaultBackground from "@/assets/defaultBackground.jpg";
import {
  DEFAULT_SEARCH_ENGINE_ID,
  LinkType,
  type Category,
  type CategoryGridItem,
  type CategoryInfo,
  type LinkGroupInfo,
} from "@/type/db";

/** 组合单个分类、未分组网址和网址分组。 */
async function buildCategoryInfo(category: Category): Promise<CategoryInfo> {
  // 统一排序后的分类直属网址和文件夹
  const categoryItems = await categoryItemService.getCategoryItems(category.id);
  // 分类直属网址
  const links = categoryItems.filter((item) => item.type === LinkType.LINK);
  // 分类直属文件夹
  const linkGroups = categoryItems.filter(
    (item) => item.type === LinkType.LINK_GROUP
  );
  // 组合组内网址后的分组数据
  const linkGroupInfos: LinkGroupInfo[] = await Promise.all(
    linkGroups.map(async (linkGroup) => ({
      ...linkGroup,
      links: await linkService.getLinkCountByParentId(linkGroup.id),
    }))
  );
  // 文件夹标识对应的页面预览数据
  const linkGroupInfoMap = new Map(
    linkGroupInfos.map((linkGroup) => [linkGroup.id, linkGroup])
  );
  // 包含文件夹预览数据的混排网格项目
  const items: CategoryGridItem[] = categoryItems.map((item) => {
    if (item.type === LinkType.LINK_GROUP) {
      return linkGroupInfoMap.get(item.id)!;
    }
    return item;
  });
  return { ...category, links, linkGroups: linkGroupInfos, items };
}

/** 加载全部分类页面数据。 */
async function loadCategoriesData(): Promise<CategoryInfo[]> {
  // 全部分类
  const categories = await categoryService.getAllCategories();
  return await Promise.all(categories.map(buildCategoryInfo));
}

/**
 * 管理新标签页的初始化和页面数据。
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

  /* 获取categories数据 */
  const refreshCategoriesData = useCallback(async () => {
    // 组合链接和分组后的分类数据
    const result = await loadCategoriesData();

    // 第一个分类
    const firstCategory = result[0];
    if (!currentCategoryId) {
      setCurrentCategoryId(firstCategory.id);
    } else {
      // 当前分类是否仍然存在
      const findCategory = result.find(
        (category) => category.id === currentCategoryId
      );
      if (!findCategory) {
        setCurrentCategoryId(firstCategory.id);
      }
    }

    setCategories(result);
  }, [currentCategoryId]);

  /* 切换当前分类 */
  const changeCurrentCategory = useCallback((categoryId: string) => {
    setCurrentCategoryId(categoryId);
  }, []);

  /* 刷新搜索设置 */
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

  /* 更新分类排序 */
  const updateCategoryOrder = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      await categoryService.updateCategoryOrder(dragIndex, hoverIndex);
      await refreshCategoriesData();
      toast.success(t("category.sortSuccess"));
    },
    [refreshCategoriesData, t]
  );

  /* 移动链接并刷新来源、目标分类的数据。 */
  const moveLink = useCallback(
    async (linkId: string, targetParentId: string, targetIndex: number) => {
      // 链接原所属父级
      const sourceParentId = categories
        .flatMap((category) => [
          { id: category.id, links: category.links },
          ...category.linkGroups,
        ])
        .find((parent) => parent.links.some((link) => link.id === linkId))?.id;
      // 链接原排序位置
      const sourceIndex = categories
        .flatMap((category) => [
          { id: category.id, links: category.links },
          ...category.linkGroups,
        ])
        .find((parent) => parent.id === sourceParentId)
        ?.links.findIndex((link) => link.id === linkId);
      // 目标父级所属分类
      const targetCategory = categories.find(
        (category) =>
          category.id === targetParentId ||
          category.linkGroups.some((linkGroup) => linkGroup.id === targetParentId)
      );

      await categoryItemService.moveLink(linkId, targetParentId, targetIndex);
      await refreshCategoriesData();
      if (targetCategory) {
        setCurrentCategoryId(targetCategory.id);
      }

      if (sourceParentId !== targetParentId) {
        toast.success(t("link.movedSuccess"));
      } else if (sourceIndex !== targetIndex) {
        toast.success(t("link.sortSuccess"));
      }
    },
    [categories, refreshCategoriesData, t]
  );

  /** 将两个未分组网址合并到自动命名的新分组。 */
  const mergeLinks = useCallback(
    async (categoryId: string, targetLinkId: string, draggedLinkId: string) => {
      // 当前分类
      const category = categories.find((item) => item.id === categoryId);
      if (!category) {
        return;
      }

      // 自动分组名称的递增序号
      let groupNameIndex = 1;
      // 当前序号对应的本地化分组名称
      let groupName = t("linkGroup.defaultName", { index: groupNameIndex });
      while (category.linkGroups.some((linkGroup) => linkGroup.name === groupName)) {
        groupNameIndex += 1;
        groupName = t("linkGroup.defaultName", { index: groupNameIndex });
      }

      await categoryItemService.mergeLinksIntoFolder(
        categoryId,
        targetLinkId,
        draggedLinkId,
        groupName
      );
      await refreshCategoriesData();
      setCurrentCategoryId(categoryId);
      toast.success(t("linkGroup.createSuccess"));
    },
    [categories, refreshCategoriesData, t]
  );

  /** 调整分类网格中的网址或文件夹顺序。 */
  const moveCategoryItem = useCallback(
    async (categoryId: string, itemId: string, targetIndex: number) => {
      await categoryItemService.moveCategoryItem(
        categoryId,
        itemId,
        targetIndex
      );
      await refreshCategoriesData();
      toast.success(t("linkGroup.sortSuccess"));
    },
    [refreshCategoriesData, t]
  );

  useEffect(() => {
    /**
     * 初始化新标签页数据。
     */
    const init = async () => {
      await systemService.init();
      await categoryService.init(i18n.t("category.defaultHome"));
      changeIsInitializedDB(true);

      // 初始化后的全部分类页面数据
      const categories = await loadCategoriesData();
      // 默认选中的首个分类
      const firstCategory = categories[0];

      setCategories(categories);
      setCurrentCategoryId(firstCategory.id);
    };
    init();
  }, []);

  // 监听标签页激活状态后刷新分类列表
  useEffect(() => {
    /**
     * 页面重新激活时刷新数据。
     */
    const refresh = async () => {
      if (isWebActive) {
        await refreshCategoriesData();
        await onLoadBackground();
        await refreshSearchEngine();
        onChangeWebActive(false);
      }
    };

    refresh();
  }, [isWebActive]);

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
  };
}
