/**
 * 系统设置服务
 * 处理搜索设置和背景图片的持久化。
 */

import { db, STORE_NAMES } from "@/utils/db";
import { getUniqueId } from "@/utils/base";
import {
  DEFAULT_SEARCH_ENGINE_ID,
  LEGACY_DEFAULT_SEARCH_ENGINE_ID,
  type CustomSearchEngine,
} from "@/type/db";

// 背景图片键
const BACKGROUND_IMAGE_KEY = "backgroundImage";
// 背景图片轻量标识键（避免比对版本时读取大体积 Blob）
const BACKGROUND_IMAGE_ID_KEY = "backgroundImageId";
// 旧版搜索引擎键
const LEGACY_SEARCH_ENGINE_KEY = "searchEngines";
// 当前搜索引擎标识键
const SELECTED_SEARCH_ENGINE_ID_KEY = "selectedSearchEngineId";
// 自定义搜索引擎列表键
const CUSTOM_SEARCH_ENGINES_KEY = "customSearchEngines";
// Dock 固定网址标识列表键
const DOCK_LINK_IDS_KEY = "dockLinkIds";

export class SystemService {
  /**
   * 初始化系统设置并迁移旧版搜索配置。
   */
  async init(): Promise<void> {
    // 并行读取旧版和新版搜索设置
    const [legacySearchEngine, selectedSearchEngineId] = await Promise.all([
      db.get<string>(STORE_NAMES.SYSTEM, LEGACY_SEARCH_ENGINE_KEY),
      db.get<string>(STORE_NAMES.SYSTEM, SELECTED_SEARCH_ENGINE_ID_KEY),
    ]);

    if (
      legacySearchEngine ||
      !selectedSearchEngineId ||
      selectedSearchEngineId === LEGACY_DEFAULT_SEARCH_ENGINE_ID
    ) {
      await this.updateSelectedSearchEngineId(DEFAULT_SEARCH_ENGINE_ID);
    }

    if (legacySearchEngine) {
      await db.delete(STORE_NAMES.SYSTEM, LEGACY_SEARCH_ENGINE_KEY);
    }
  }

  /**
   * 获取当前搜索引擎标识。
   */
  async getSelectedSearchEngineId(): Promise<string> {
    // 已保存的搜索引擎标识
    const selectedSearchEngineId = await db.get<string>(
      STORE_NAMES.SYSTEM,
      SELECTED_SEARCH_ENGINE_ID_KEY
    );
    return selectedSearchEngineId === LEGACY_DEFAULT_SEARCH_ENGINE_ID
      ? DEFAULT_SEARCH_ENGINE_ID
      : selectedSearchEngineId ?? DEFAULT_SEARCH_ENGINE_ID;
  }

  /**
   * 保存当前搜索引擎标识。
   */
  async updateSelectedSearchEngineId(
    selectedSearchEngineId: string
  ): Promise<void> {
    await db.putWithKey(
      STORE_NAMES.SYSTEM,
      SELECTED_SEARCH_ENGINE_ID_KEY,
      selectedSearchEngineId
    );
  }

  /**
   * 获取自定义搜索引擎列表。
   */
  async getCustomSearchEngines(): Promise<CustomSearchEngine[]> {
    // 已保存的自定义搜索引擎
    const customSearchEngines = await db.get<CustomSearchEngine[]>(
      STORE_NAMES.SYSTEM,
      CUSTOM_SEARCH_ENGINES_KEY
    );
    return customSearchEngines ?? [];
  }

  /**
   * 保存自定义搜索引擎列表。
   */
  async updateCustomSearchEngines(
    customSearchEngines: CustomSearchEngine[]
  ): Promise<void> {
    await db.putWithKey(
      STORE_NAMES.SYSTEM,
      CUSTOM_SEARCH_ENGINES_KEY,
      customSearchEngines
    );
  }

  /**
   * 获取 Dock 中固定的网址标识。
   */
  async getDockLinkIds(): Promise<string[]> {
    // 已保存的 Dock 网址标识
    const dockLinkIds = await db.get<string[]>(
      STORE_NAMES.SYSTEM,
      DOCK_LINK_IDS_KEY
    );
    return dockLinkIds ?? [];
  }

  /**
   * 保存 Dock 中固定的网址标识。
   */
  async updateDockLinkIds(dockLinkIds: string[]): Promise<void> {
    await db.putWithKey(
      STORE_NAMES.SYSTEM,
      DOCK_LINK_IDS_KEY,
      dockLinkIds
    );
  }

  /**
   * 保存背景图片并同步更新轻量标识键
   */
  async saveBackgroundImage(file: File | Blob): Promise<string> {
    // 背景图片唯一标识
    const id = getUniqueId();
    // 验证文件类型
    if (file instanceof File && !file.type.startsWith("image/")) {
      throw new Error("只支持图片文件");
    }

    await Promise.all([
      db.putWithKey(STORE_NAMES.SYSTEM, BACKGROUND_IMAGE_KEY, {
        blob: file,
        id: id,
      }),
      db.putWithKey(STORE_NAMES.SYSTEM, BACKGROUND_IMAGE_ID_KEY, id),
    ]);

    return id;
  }

  /**
   * 仅读取当前背景图片的轻量标识；若旧数据缺少标识键则从图片记录回填
   */
  async getBackgroundImageId(): Promise<string> {
    const storedId = await db.get<string>(
      STORE_NAMES.SYSTEM,
      BACKGROUND_IMAGE_ID_KEY
    );
    if (storedId !== undefined) {
      return storedId;
    }

    const result = await db.get<{ id: string; blob: Blob }>(
      STORE_NAMES.SYSTEM,
      BACKGROUND_IMAGE_KEY
    );
    const resolvedId = result?.id ?? "";
    await db.putWithKey(STORE_NAMES.SYSTEM, BACKGROUND_IMAGE_ID_KEY, resolvedId);
    return resolvedId;
  }

  /**
   * 获取背景图片 URL
   */
  async getBackgroundImageUrl(): Promise<{
    id: string;
    url: string;
  } | null> {
    // 已保存的背景图片数据
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
   * 删除背景图片并清理轻量标识键
   */
  async deleteBackgroundImage(): Promise<void> {
    await Promise.all([
      db.delete(STORE_NAMES.SYSTEM, BACKGROUND_IMAGE_KEY),
      db.delete(STORE_NAMES.SYSTEM, BACKGROUND_IMAGE_ID_KEY),
    ]);
  }

  /**
   * 检查是否有背景图片
   */
  async hasBackgroundImage(): Promise<boolean> {
    return Boolean(await this.getBackgroundImageId());
  }
}

// 导出单例
export const systemService = new SystemService();
