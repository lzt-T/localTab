import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { categoryService } from "@/services/categoryService";
import { linkService } from "@/services/linkService";
import { systemService } from "@/services/systemService";
import { db, STORE_NAMES } from "@/utils/db";
import {
  DEFAULT_SEARCH_ENGINE_ID,
  LEGACY_DEFAULT_SEARCH_ENGINE_ID,
  type Category,
  type CustomSearchEngine,
  type Link,
  type LinkGroup,
} from "@/type/db";

// 导出数据类型定义
export type ExportData = {
  version: string;
  exportDate: string;
  categories: Category[];
  links: Link[];
  linkGroups?: LinkGroup[];
  system: {
    selectedSearchEngineId?: string;
    customSearchEngines?: CustomSearchEngine[];
    /* 兼容旧版备份字段 */
    searchEngine?: string;
    backgroundImage?: {
      id: string;
      base64: string;
      mimeType: string;
    };
  };
};

/**
 * 管理本地数据的导入和导出。
 */
export function useDataManagement() {
  // 国际化工具
  const { t } = useTranslation();
  // 数据导出状态
  const [isExporting, setIsExporting] = useState(false);
  // 数据导入状态
  const [isImporting, setIsImporting] = useState(false);

  // 将 Blob 转换为 base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 文件读取器
      const reader = new FileReader();
      reader.onloadend = () => {
        // 带 MIME 前缀的 Base64 内容
        const base64 = reader.result as string;
        resolve(base64.split(",")[1]); // 移除 data:image/...;base64, 前缀
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // 将 base64 转换为 Blob
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    // 解码后的字符内容
    const byteCharacters = atob(base64);
    // 字节数值列表
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    // 二进制字节数组
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // 导出数据
  const onExport = async () => {
    setIsExporting(true);
    try {
      // 获取所有数据
      const categories = await categoryService.getAllCategories();
      // 全部链接
      const links = await linkService.getAllLinks();
      // 全部链接组
      const linkGroups = await db.getAll<LinkGroup>(STORE_NAMES.LINK_GROUP);

      // 获取系统数据
      const [selectedSearchEngineId, customSearchEngines] = await Promise.all([
        systemService.getSelectedSearchEngineId(),
        systemService.getCustomSearchEngines(),
      ]);
      // 已保存的背景图片
      const backgroundImageData = await db.get<{ id: string; blob: Blob }>(
        STORE_NAMES.SYSTEM,
        "backgroundImage"
      );

      // 准备导出数据
      const exportData: ExportData = {
        version: "1.0.1",
        exportDate: new Date().toISOString(),
        categories,
        links,
        linkGroups,
        system: {
          selectedSearchEngineId,
          customSearchEngines,
        },
      };

      // 如果有背景图片，转换为 base64
      if (backgroundImageData) {
        // 背景图片 Base64 内容
        const base64 = await blobToBase64(backgroundImageData.blob);
        exportData.system.backgroundImage = {
          id: backgroundImageData.id,
          base64,
          mimeType: backgroundImageData.blob.type,
        };
      }

      // 创建 JSON 文件并下载
      const jsonStr = JSON.stringify(exportData, null, 2);
      // 备份文件内容
      const blob = new Blob([jsonStr], { type: "application/json" });
      // 备份文件临时地址
      const url = URL.createObjectURL(blob);
      // 备份文件下载元素
      const a = document.createElement("a");
      a.href = url;
      a.download = `localTab-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t("dataManagement.exportSuccess"));
    } catch (error) {
      console.error("导出数据失败:", error);
      toast.error(t("dataManagement.exportFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  // 导入数据
  const onImport = async (file: File) => {
    setIsImporting(true);
    try {
      // 读取文件内容
      const text = await file.text();
      // 解析后的备份数据
      const importData: ExportData = JSON.parse(text);

      // 验证数据格式
      if (!importData.version || !importData.categories || !importData.links) {
        toast.error(t("dataManagement.invalidFile"));
        return false;
      }

      // 清空现有数据
      await db.clear(STORE_NAMES.CATEGORY);
      await db.clear(STORE_NAMES.LINK);
      await db.clear(STORE_NAMES.LINK_GROUP);
      await db.clear(STORE_NAMES.SYSTEM);

      // 导入分类
      for (const category of importData.categories) {
        await db.put(STORE_NAMES.CATEGORY, category);
      }

      // 导入链接
      for (const link of importData.links) {
        await db.put(STORE_NAMES.LINK, link);
      }

      // 导入链接组
      if (importData.linkGroups) {
        for (const linkGroup of importData.linkGroups) {
          await db.put(STORE_NAMES.LINK_GROUP, linkGroup);
        }
      }

      // 导入自定义搜索引擎
      const customSearchEngines = importData.system?.customSearchEngines ?? [];
      // 备份中保存的搜索引擎标识
      const storedSearchEngineId = importData.system?.selectedSearchEngineId;
      // 兼容旧版默认搜索引擎标识
      const normalizedSearchEngineId =
        storedSearchEngineId === LEGACY_DEFAULT_SEARCH_ENGINE_ID
          ? DEFAULT_SEARCH_ENGINE_ID
          : storedSearchEngineId;
      // 备份中的当前选项是否有效
      const isSelectedEngineValid =
        normalizedSearchEngineId === DEFAULT_SEARCH_ENGINE_ID ||
        customSearchEngines.some(
          (searchEngine) => searchEngine.id === normalizedSearchEngineId
        );
      // 旧版备份和失效选项统一回退到浏览器默认搜索
      const selectedSearchEngineId =
        isSelectedEngineValid && normalizedSearchEngineId
          ? normalizedSearchEngineId
          : DEFAULT_SEARCH_ENGINE_ID;
      await Promise.all([
        systemService.updateCustomSearchEngines(customSearchEngines),
        systemService.updateSelectedSearchEngineId(selectedSearchEngineId),
      ]);

      // 导入背景图片
      if (importData.system?.backgroundImage) {
        // 备份中的背景图片字段
        const { base64, mimeType, id } = importData.system.backgroundImage;
        // 还原后的背景图片
        const blob = base64ToBlob(base64, mimeType);
        await db.putWithKey(STORE_NAMES.SYSTEM, "backgroundImage", {
          id,
          blob,
        });
      }

      toast.success(t("dataManagement.importSuccess"));
      return true;
    } catch (error) {
      console.error("导入数据失败:", error);
      toast.error(t("dataManagement.importFailed"));
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isExporting,
    isImporting,
    onExport,
    onImport,
  };
}
