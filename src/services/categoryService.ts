/**
 * 类别服务
 * 处理类别的业务逻辑
 */

import { db, STORE_NAMES } from "@/utils/db";
import type { Category } from "@/type/db";
import { linkService } from "@/services/linkService";
import { linkGroupService } from "@/services/linkGroupService";
import { getUniqueId } from "@/utils/base";

export class CategoryService {
  /**
   * 初始化服务（确保有默认分类）
   */
  async init(defaultCategoryName: string): Promise<void> {
    try {
      // 当前全部分类
      const categories = await this.getAllCategories();

      // 如果没有分类，创建默认的"主页"分类
      if (categories.length === 0) {
        await db.put(STORE_NAMES.CATEGORY, {
          id: "home",
          name: defaultCategoryName,
          icon: "house",
          sort: 0,
        });
        console.log("已创建默认主页分类");
      }
    } catch (error) {
      console.error("初始化分类服务失败:", error);
      throw error;
    }
  }

  /**
   * 创建类别
   */
  async createCategory(data: Partial<Category>): Promise<void> {
    // 新分类的排序位置
    const sort = await this.getCategoryCount();
    // 待保存的分类数据
    const result: Category = {
      id: getUniqueId(),
      name: data.name || "",
      icon: data.icon || "",
      sort: sort,
    };
    await db.put(STORE_NAMES.CATEGORY, result);
  }

  /**
   * 更新类别
   */
  async updateCategory(id: string, data: Partial<Category>): Promise<void> {
    // 待更新的分类
    const category = await this.getCategory(id);
    if (!category) {
      return;
    }
    await db.put(STORE_NAMES.CATEGORY, {
      ...category,
      ...data,
    });
  }

  /**
   * 获取单个类别
   */
  async getCategory(id: string): Promise<Category | undefined> {
    return await db.get<Category>(STORE_NAMES.CATEGORY, id);
  }

  /**
   * 获取所有类别
   */
  async getAllCategories(): Promise<Category[]> {
    // 数据库中的全部分类
    const categories = await db.getAll<Category>(STORE_NAMES.CATEGORY);
    /* 按排序号排序 */
    categories.sort((a, b) => a.sort - b.sort);
    return categories;
  }

  /**
   * 删除类别
   */
  async deleteCategory(id: string): Promise<void> {
    // 当前全部分类
    const allCategories = await this.getAllCategories();
    // 待删除的分类
    const deleteCategory = allCategories.find((category) => category.id === id);
    // 待删除分类的排序位置
    const delSort = deleteCategory!.sort;

    for (const category of allCategories) {
      if (category.sort > delSort) {
        category.sort = category.sort - 1;
        await this.updateCategory(category.id, category);
      }
    }

    /* 删除分类内的分组和全部网址 */
    await linkGroupService.deleteLinkGroupsByParentId(id);
    await linkService.deleteLinkByParentId(id);
    /* 删除分类 */
    await db.delete(STORE_NAMES.CATEGORY, id);
  }

  /* 获取长度 */
  async getCategoryCount(): Promise<number> {
    // 当前全部分类
    const categories = await db.getAll<Category>(STORE_NAMES.CATEGORY);
    return categories.length;
  }

  /**
   * 更新分类排序
   * @param dragIndex 拖拽的源索引
   * @param hoverIndex 放置的目标索引
   */
  async updateCategoryOrder(dragIndex: number, hoverIndex: number): Promise<void> {
    // 当前排序的全部分类
    const categories = await this.getAllCategories();
    
    if (dragIndex === hoverIndex) {
      return;
    }

    // 被拖动的分类
    const draggedCategory = categories[dragIndex];
    // 调整顺序后的分类列表
    const newCategories = [...categories];
    newCategories.splice(dragIndex, 1);
    newCategories.splice(hoverIndex, 0, draggedCategory);

    // 更新所有分类的排序
    for (let i = 0; i < newCategories.length; i++) {
      if (newCategories[i].sort !== i) {
        await this.updateCategory(newCategories[i].id, { sort: i });
      }
    }
  }
}

// 导出单例
export const categoryService = new CategoryService();
