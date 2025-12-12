/**
 * 背景图片服务
 * 处理背景图片的业务逻辑
 */

import { db, STORE_NAMES } from '../utils/db'

const BACKGROUND_IMAGE_KEY = 'backgroundImage'

export class BackgroundService {
  /**
   * 保存背景图片
   */
  async saveBackgroundImage(file: File | Blob): Promise<void> {
    // 验证文件类型
    if (file instanceof File && !file.type.startsWith('image/')) {
      throw new Error('只支持图片文件')
    }

    // 验证文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('图片大小不能超过10MB')
    }

    await db.putWithKey(STORE_NAMES.SETTINGS, BACKGROUND_IMAGE_KEY, file)
  }

  /**
   * 获取背景图片 URL
   */
  async getBackgroundImageUrl(): Promise<string | null> {
    const blob = await db.get<Blob>(STORE_NAMES.SETTINGS, BACKGROUND_IMAGE_KEY)
    if (!blob) return null
    return URL.createObjectURL(blob)
  }

  /**
   * 删除背景图片
   */
  async deleteBackgroundImage(): Promise<void> {
    await db.delete(STORE_NAMES.SETTINGS, BACKGROUND_IMAGE_KEY)
  }

  /**
   * 检查是否有背景图片
   */
  async hasBackgroundImage(): Promise<boolean> {
    const blob = await db.get<Blob>(STORE_NAMES.SETTINGS, BACKGROUND_IMAGE_KEY)
    return !!blob
  }
}

// 导出单例
export const backgroundService = new BackgroundService()

