/**
 * 背景图片服务
 * 处理背景图片的业务逻辑
 */

import { db, STORE_NAMES } from "../utils/db";
import { getUniqueId } from "@/utils/base";

const BACKGROUND_IMAGE_KEY = "backgroundImage";

export class BackgroundService {
  /**
   * 保存背景图片
   */
  async saveBackgroundImage(file: File | Blob): Promise<string> {
    const id = getUniqueId();
    // 验证文件类型
    if (file instanceof File && !file.type.startsWith("image/")) {
      throw new Error("只支持图片文件");
    }

    await db.putWithKey(STORE_NAMES.SETTINGS, BACKGROUND_IMAGE_KEY, {
      blob: file,
      id: id,
    });

    return id;
  }

  /**
   * 获取背景图片 URL
   */
  async getBackgroundImageUrl(): Promise<{
    id: string;
    url: string;
  } | null> {
    const result = await db.get<{ id: string; blob: Blob }>(
      STORE_NAMES.SETTINGS,
      BACKGROUND_IMAGE_KEY
    );
    if (!result) return null;
    return {
      id: result.id,
      url: URL.createObjectURL(result.blob),
    };
  }

  /**
   * 删除背景图片
   */
  async deleteBackgroundImage(): Promise<void> {
    await db.delete(STORE_NAMES.SETTINGS, BACKGROUND_IMAGE_KEY);
  }

  /**
   * 检查是否有背景图片
   */
  async hasBackgroundImage(): Promise<boolean> {
    const result = await db.get<{ id: string; blob: Blob }>(
      STORE_NAMES.SETTINGS,
      BACKGROUND_IMAGE_KEY
    );
    return !!result;
  }
}

// 导出单例
export const backgroundService = new BackgroundService();
