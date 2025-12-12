import { useState, useEffect, useCallback } from "react";
import { categoryService } from "../services/categoryService";
import type { category, link } from "../type/db";
import useSystemStore from "../store/systemStore";
import { linkService } from "../services/linkService";

export function useData() {
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
    setCategories(categories);
  }, []);

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

  return {
    currentCategoryId,
    categories,
    categoryLinks,
    changeCurrentCategory,
    refreshCategories,
    refreshCategoryLinks,
  };
}
