/**
 * 背景图片服务
 * 处理背景图片的业务逻辑
 */

import { db, STORE_NAMES } from "../utils/db";
import { getUniqueId } from "@/utils/base";
import { SearchEngineType } from "@/type/db";

/*  背景图片键 */
const BACKGROUND_IMAGE_KEY = "backgroundImage";
/* 搜索引擎键 */
const SEARCH_ENGINES_KEY = "searchEngines";

export class SystemService {
  /**
   * 初始化服务
   */
  async init(): Promise<void> {
    const searchEngine = await this.getSearchEngine();

    // 如果搜索引擎类型不存在，则设置为谷歌
    if (!searchEngine) {
      await this.updateSearchEngine(SearchEngineType.GOOGLE);
    }
  }

  /**
   * 保存搜索引擎类型
   * @param searchEngine 搜索引擎类型
   * @returns void
   */
  async updateSearchEngine(
    searchEngine: keyof typeof SearchEngineType
  ): Promise<void> {
    await db.putWithKey(STORE_NAMES.SYSTEM, SEARCH_ENGINES_KEY, searchEngine);
  }

  /**
   * 获取搜索引擎类型
   * @returns 搜索引擎类型
   */
  async getSearchEngine(): Promise<typeof SearchEngineType | undefined> {
    const result = await db.get<typeof SearchEngineType>(
      STORE_NAMES.SYSTEM,
      SEARCH_ENGINES_KEY
    );
    return result;
  }

  /**
   * 保存背景图片
   */
  async saveBackgroundImage(file: File | Blob): Promise<string> {
    const id = getUniqueId();
    // 验证文件类型
    if (file instanceof File && !file.type.startsWith("image/")) {
      throw new Error("只支持图片文件");
    }

    await db.putWithKey(STORE_NAMES.SYSTEM, BACKGROUND_IMAGE_KEY, {
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
      STORE_NAMES.SYSTEM,
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
    await db.delete(STORE_NAMES.SYSTEM, BACKGROUND_IMAGE_KEY);
  }

  /**
   * 检查是否有背景图片
   */
  async hasBackgroundImage(): Promise<boolean> {
    const result = await db.get<{ id: string; blob: Blob }>(
      STORE_NAMES.SYSTEM,
      BACKGROUND_IMAGE_KEY
    );
    return !!result;
  }
}

// 导出单例
export const systemService = new SystemService();
