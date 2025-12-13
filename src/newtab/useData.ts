import { useState, useEffect, useCallback } from "react";
import { categoryService } from "../services/categoryService";
import type { category, link } from "../type/db";
import useSystemStore from "../store/systemStore";
import { linkService } from "../services/linkService";
import { useWebActive } from "../hooks/useWebActive";

export function useData() {
  const { isWebActive, onChangeWebActive } = useWebActive();
  const changeIsInitializedDB = useSystemStore(
    (state) => state.changeIsInitializedDB
  );
  const [currentCategoryId, setCurrentCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<category[]>([]);
  const [categoryLinks, setCategoryLinks] = useState<link[]>([]);

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

  useEffect(() => {
    const init = async () => {
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
        onChangeWebActive(false);
      }
    };

    refresh();
  }, [isWebActive]);

  return {
    currentCategoryId,
    categories,
    categoryLinks,
    changeCurrentCategory,
    refreshCategories,
    refreshCategoryLinks,
  };
}
