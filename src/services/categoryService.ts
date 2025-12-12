/**
 * 类别服务
 * 处理类别的业务逻辑
 */

import { db, STORE_NAMES } from '../utils/db'
import type { category } from '../type/db'
import { linkService } from './linkService'

// 默认主页分类常量
const DEFAULT_HOME_CATEGORY: category = {
  id: 'home',
  name: '主页',
  icon: 'house',
  description: '默认主页分类',
  sort: 0
}

export class CategoryService {
  /**
   * 初始化服务（确保有默认分类）
   */
  async init(): Promise<void> {
    try {
      const categories = await this.getAllCategories()
      
      // 如果没有分类，创建默认的"主页"分类
      if (categories.length === 0) {
        await db.put(STORE_NAMES.CATEGORY, DEFAULT_HOME_CATEGORY)
        console.log('已创建默认主页分类')
      }
    } catch (error) {
      console.error('初始化分类服务失败:', error)
      throw error
    }
  }

  /**
   * 创建类别
   */
  async createCategory(category: category): Promise<void> {
    await db.put(STORE_NAMES.CATEGORY, category)
  }

  /**
   * 更新类别
   */
  async updateCategory(category: category): Promise<void> {
    await db.put(STORE_NAMES.CATEGORY, category)
  }

  /**
   * 获取单个类别
   */
  async getCategory(id: string): Promise<category | undefined> {
    return await db.get<category>(STORE_NAMES.CATEGORY, id)
  }

  /**
   * 获取所有类别
   */
  async getAllCategories(): Promise<category[]> {
    const categories = await db.getAll<category>(STORE_NAMES.CATEGORY)
    /* 按排序号排序 */
    categories.sort((a, b) => a.sort - b.sort)
    return categories
  }

  /**
   * 删除类别
   */
  async deleteCategory(id: string): Promise<void> {
    /* 删除类别 */
    await db.delete(STORE_NAMES.CATEGORY, id)
    /* 删除类别下的所有链接  ( 异步就 可以)*/
    linkService.deleteLinkByParentId(id)
  }

  /* 获取长度 */
  async getCategoryCount(): Promise<number> {
    const categories = await db.getAll<category>(STORE_NAMES.CATEGORY)
    return categories.length
  }
}

// 导出单例
export const categoryService = new CategoryService()

