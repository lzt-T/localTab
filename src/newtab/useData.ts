import { useState, useEffect, useCallback } from "react";
import { categoryService } from "../services/categoryService";
import type { CategoryInfo } from "../type/db";
import useSystemStore from "../store/systemStore";
import { linkService, systemService } from "../services/index";
import { useWebActive } from "../hooks/useWebActive";
import { toast } from "sonner";
import { useBackgroundImg } from "../hooks/useBackgroundImg";
import defaultBackground from "@/assets/defaultBackground.jpg";
import { useMemo } from "react";
import { SearchEngineType } from "@/type/db";

export function useData() {
  const { isWebActive, onChangeWebActive } = useWebActive();
  const { onLoadBackground, backgroundImage } = useBackgroundImg();
  const changeIsInitializedDB = useSystemStore(
    (state) => state.changeIsInitializedDB
  );
  const [currentCategoryId, setCurrentCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const isInitializedBackgroundImage = useSystemStore(
    (state) => state.isInitializedBackgroundImage
  );
  const changeSearchEngine = useSystemStore(
    (state) => state.changeSearchEngine
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
    const categories = await categoryService.getAllCategories();
    const result: CategoryInfo[] = [];
    for (const category of categories) {
      const links = await linkService.getLinkCountByParentId(category.id);
      result.push({
        ...category,
        links,
      });
    }

    const firstCategory = result[0];
    if (!currentCategoryId) {
      setCurrentCategoryId(firstCategory.id);
    } else {
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

  /* 刷新搜索引擎 */
  const refreshSearchEngine = useCallback(async () => {
    const searchEngine = await systemService.getSearchEngine();
    if (searchEngine) {
      changeSearchEngine(
        searchEngine as unknown as keyof typeof SearchEngineType
      );
    }
  }, [changeSearchEngine]);

  /* 更新分类排序 */
  const updateCategoryOrder = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      await categoryService.updateCategoryOrder(dragIndex, hoverIndex);
      await refreshCategoriesData();
      toast.success("分类排序更新成功");
    },
    [refreshCategoriesData]
  );

  /* 更新链接排序 */
  const updateLinkOrder = useCallback(
    async (parentId: string, dragIndex: number, hoverIndex: number) => {
      await linkService.updateLinkOrder(parentId, dragIndex, hoverIndex);
      await refreshCategoriesData();
      toast.success("链接排序更新成功");
    },
    [refreshCategoriesData]
  );

  useEffect(() => {
    const init = async () => {
      await systemService.init();
      await categoryService.init();
      changeIsInitializedDB(true);

      const categories = await categoryService.getAllCategories();
      const firstCategory = categories[0];

      const result: CategoryInfo[] = [];
      for (const category of categories) {
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
    updateLinkOrder,
  };
}
