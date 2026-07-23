import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { categoryService } from "@/services/categoryService";
import { browserSearchService } from "@/services/browserSearchService";
import useSystemStore from "@/store/systemStore";
import { linkService, systemService } from "@/services/index";
import { useWebActive } from "@/hooks/useWebActive";
import { toast } from "sonner";
import { useBackgroundImg } from "@/hooks/useBackgroundImg";
import defaultBackground from "@/assets/defaultBackground.jpg";
import { DEFAULT_SEARCH_ENGINE_ID, type CategoryInfo } from "@/type/db";

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
    // 全部分类
    const categories = await categoryService.getAllCategories();
    // 组合链接后的分类数据
    const result: CategoryInfo[] = [];
    for (const category of categories) {
      // 当前分类下的链接
      const links = await linkService.getLinkCountByParentId(category.id);
      result.push({
        ...category,
        links,
      });
    }

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
    async (linkId: string, targetCategoryId: string, targetIndex: number) => {
      // 链接原所属分类
      const sourceCategory = categories.find((category) =>
        category.links.some((link) => link.id === linkId)
      );
      // 链接原排序位置
      const sourceIndex = sourceCategory?.links.findIndex(
        (link) => link.id === linkId
      );

      await linkService.moveLink(linkId, targetCategoryId, targetIndex);
      await refreshCategoriesData();
      setCurrentCategoryId(targetCategoryId);

      if (sourceCategory?.id !== targetCategoryId) {
        toast.success(t("link.movedSuccess"));
      } else if (sourceIndex !== targetIndex) {
        toast.success(t("link.sortSuccess"));
      }
    },
    [categories, refreshCategoriesData, t]
  );

  useEffect(() => {
    /**
     * 初始化新标签页数据。
     */
    const init = async () => {
      await systemService.init();
      await categoryService.init(i18n.t("category.defaultHome"));
      changeIsInitializedDB(true);

      // 初始化后的全部分类
      const categories = await categoryService.getAllCategories();
      // 默认选中的首个分类
      const firstCategory = categories[0];

      // 组合链接后的分类数据
      const result: CategoryInfo[] = [];
      for (const category of categories) {
        // 当前分类下的链接
        const links = await linkService.getLinkCountByParentId(category.id);
        result.push({
          ...category,
          links,
        });
      }

      setCategories(result);
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
  };
}
