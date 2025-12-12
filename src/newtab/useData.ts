import { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../services/categoryService';
import type { category, link } from '../type/db';
import useSystemStore from '../store/systemStore';
import { linkService } from '../services/linkService';
import { toast } from 'sonner';

export function useData() {
  const changeIsInitializedDB = useSystemStore((state) => state.changeIsInitializedDB);
  const [currentCategoryId, setCurrentCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<category[]>([]);
  const [categoryLinks, setCategoryLinks] = useState<link[]>([]);

  /* 获取当前分类里的链接· */
  const getCategoryLinks = useCallback(async (id: string) => {
    const links = await linkService.getLinkCountByParentId(id);
    return links;
  }, []);

  /* 切换当前分类 */
  const changeCurrentCategory = useCallback(async (categoryId: string) => {
    const links = await getCategoryLinks(categoryId);
    setCurrentCategoryId(categoryId);
    setCategoryLinks(links);
  }, [getCategoryLinks]);

  /* 刷新分类列表 */
  const refreshCategories = useCallback(async () => {
    const categories = await categoryService.getAllCategories();
    setCategories(categories);
  }, []);

  /* 添加链接 */
  const addLink = useCallback(async () => {
    await linkService.updateLink({
      parentId: currentCategoryId,
    });
    toast.success('添加链接成功');
    const links = await getCategoryLinks(currentCategoryId);
    setCategoryLinks(links);
  }, [currentCategoryId, getCategoryLinks]);

  useEffect(() => {
    const init = async () => {
      await categoryService.init();
      changeIsInitializedDB(true);

      const categories = await categoryService.getAllCategories();
      const firstCategory = categories[0];
      const links = await getCategoryLinks(firstCategory.id) || [];
      setCategoryLinks(links);
      setCategories(categories);
      setCurrentCategoryId(firstCategory.id);
    }
    init();
  }, []);

  return {
    currentCategoryId,
    categories,
    categoryLinks,
    changeCurrentCategory,
    refreshCategories,
    addLink,
  };
}