import { useState, useEffect, useCallback, useRef } from "react";
import { categoryService } from "../services/categoryService";
import type { category, link } from "../type/db";
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
  const [categories, setCategories] = useState<category[]>([]);
  const [categoryLinks, setCategoryLinks] = useState<link[]>([]);
  const linkListRef = useRef<HTMLDivElement>(null);
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

  /* 获取当前分类里的链接· */
  const refreshCategoryLinks = useCallback(async (id: string) => {
    const links = await linkService.getLinkCountByParentId(id);
    setCategoryLinks(links);
  }, []);

  /* 切换当前分类 */
  const changeCurrentCategory = useCallback(
    async (categoryId: string) => {
      await refreshCategoryLinks(categoryId);
      setCurrentCategoryId(categoryId);
      linkListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
    [refreshCategoryLinks]
  );

  /* 刷新分类列表 */
  const refreshCategories = useCallback(async () => {
    const categories = await categoryService.getAllCategories();

    /* 如果当前分类不存在，则设置为第一个分类 */
    const findCategory = categories.find(
      (category) => category.id === currentCategoryId
    );

    if (!findCategory) {
      setCurrentCategoryId(categories[0].id);
      await refreshCategoryLinks(categories[0].id);
    }

    /* 设置分类列表 */
    setCategories(categories);
  }, [currentCategoryId, refreshCategoryLinks]);

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
      await refreshCategories();
      toast.success("分类排序更新成功");
    },
    [refreshCategories]
  );

  /* 更新链接排序 */
  const updateLinkOrder = useCallback(
    async (parentId: string, dragIndex: number, hoverIndex: number) => {
      await linkService.updateLinkOrder(parentId, dragIndex, hoverIndex);
      await refreshCategoryLinks(parentId);
      toast.success("链接排序更新成功");
    },
    [refreshCategoryLinks]
  );

  useEffect(() => {
    const init = async () => {
      await systemService.init();
      await categoryService.init();
      changeIsInitializedDB(true);

      const categories = await categoryService.getAllCategories();
      const firstCategory = categories[0];
      await refreshCategoryLinks(firstCategory.id);

      setCategories(categories);
      setCurrentCategoryId(firstCategory.id);
    };
    init();
  }, []);

  // 监听标签页激活状态后刷新分类列表
  useEffect(() => {
    const refresh = async () => {
      if (isWebActive) {
        await refreshCategories();
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
    categoryLinks,
    linkListRef,
    backgroundStyle,
    changeCurrentCategory,
    refreshCategories,
    refreshCategoryLinks,
    updateCategoryOrder,
    updateLinkOrder,
  };
}
