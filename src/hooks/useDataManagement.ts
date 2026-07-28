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
    dockLinkIds?: string[];
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

  /** 导出全部本地数据。 */
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
      const [selectedSearchEngineId, customSearchEngines, dockLinkIds] =
        await Promise.all([
          systemService.getSelectedSearchEngineId(),
          systemService.getCustomSearchEngines(),
          systemService.getDockLinkIds(),
        ]);
      // 已保存的背景图片
      const backgroundImageData = await db.get<{ id: string; blob: Blob }>(
        STORE_NAMES.SYSTEM,
        "backgroundImage"
      );

      // 准备导出数据
      const exportData: ExportData = {
        version: "1.0.2",
        exportDate: new Date().toISOString(),
        categories,
        links,
        linkGroups,
        system: {
          selectedSearchEngineId,
          customSearchEngines,
          dockLinkIds,
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

  /** 导入备份并覆盖全部本地数据。 */
  const onImport = async (file: File) => {
    setIsImporting(true);
    try {
      // 读取文件内容
      const text = await file.text();
      // 解析后的备份数据
      const importData: ExportData = JSON.parse(text);

      // 验证数据格式
      if (
        !importData.version ||
        !Array.isArray(importData.categories) ||
        !Array.isArray(importData.links) ||
        (importData.linkGroups !== undefined &&
          !Array.isArray(importData.linkGroups)) ||
        (importData.system?.customSearchEngines !== undefined &&
          !Array.isArray(importData.system.customSearchEngines))
      ) {
        toast.error(t("dataManagement.invalidFile"));
        return false;
      }

      // 备份中待恢复的 Dock 网址标识
      const storedDockLinkIds: unknown = importData.system?.dockLinkIds;
      // 备份中存在的网址标识
      const importedLinkIds = new Set(importData.links.map((link) => link.id));
      // 已接收的 Dock 网址标识
      const seenDockLinkIds = new Set<string>();
      // 有效且保持原顺序的 Dock 网址标识
      const dockLinkIds = Array.isArray(storedDockLinkIds)
        ? storedDockLinkIds.filter(
            (dockLinkId): dockLinkId is string => {
              if (
                typeof dockLinkId !== "string" ||
                !importedLinkIds.has(dockLinkId) ||
                seenDockLinkIds.has(dockLinkId)
              ) {
                return false;
              }
              seenDockLinkIds.add(dockLinkId);
              return true;
            }
          )
        : [];

      // 导入前准备自定义搜索引擎
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

      // 在清空现有数据前完成背景图片解码
      let backgroundImage: { id: string; blob: Blob } | undefined;
      if (importData.system?.backgroundImage) {
        // 备份中的背景图片字段
        const { base64, mimeType, id } = importData.system.backgroundImage;
        // 还原后的背景图片
        const blob = base64ToBlob(base64, mimeType);
        backgroundImage = { id, blob };
      }

      // 待原子写入的全部系统设置
      const system = [
        { key: "customSearchEngines", value: customSearchEngines },
        { key: "selectedSearchEngineId", value: selectedSearchEngineId },
        { key: "dockLinkIds", value: dockLinkIds },
      ];
      if (backgroundImage) {
        system.push({ key: "backgroundImage", value: backgroundImage });
      }

      // 单个事务内替换全部数据，任意失败都会回滚
      await db.replaceAll({
        categories: importData.categories,
        links: importData.links,
        linkGroups: importData.linkGroups ?? [],
        system,
      });

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
