import { useState } from "react";
import { toast } from "sonner";
import { categoryService } from "../services/categoryService";
import { linkService } from "../services/linkService";
import { systemService } from "../services/systemService";
import { db, STORE_NAMES } from "../utils/db";
import type { Category, Link, LinkGroup } from "../type/db";
import { SearchEngineType } from "../type/db";

// 导出数据类型定义
export type ExportData = {
  version: string;
  exportDate: string;
  categories: Category[];
  links: Link[];
  linkGroups: LinkGroup[];
  system: {
    searchEngine?: string;
    backgroundImage?: {
      id: string;
      base64: string;
      mimeType: string;
    };
  };
};

export function useDataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // 将 Blob 转换为 base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(",")[1]); // 移除 data:image/...;base64, 前缀
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // 将 base64 转换为 Blob
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // 导出数据
  const onExport = async () => {
    setIsExporting(true);
    try {
      // 获取所有数据
      const categories = await categoryService.getAllCategories();
      const links = await linkService.getAllLinks();
      const linkGroups = await db.getAll<LinkGroup>(STORE_NAMES.LINK_GROUP);

      // 获取系统数据
      const searchEngine = await systemService.getSearchEngine();
      const backgroundImageData = await db.get<{ id: string; blob: Blob }>(
        STORE_NAMES.SYSTEM,
        "backgroundImage"
      );

      // 准备导出数据
      const exportData: ExportData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        categories,
        links,
        linkGroups,
        system: {
          searchEngine: searchEngine as string | undefined,
        },
      };

      // 如果有背景图片，转换为 base64
      if (backgroundImageData) {
        const base64 = await blobToBase64(backgroundImageData.blob);
        exportData.system.backgroundImage = {
          id: backgroundImageData.id,
          base64,
          mimeType: backgroundImageData.blob.type,
        };
      }

      // 创建 JSON 文件并下载
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `localTab-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("数据导出成功");
    } catch (error) {
      console.error("导出数据失败:", error);
      toast.error("导出数据失败");
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
      const importData: ExportData = JSON.parse(text);

      // 验证数据格式
      if (!importData.version || !importData.categories || !importData.links) {
        toast.error("无效的数据文件格式");
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

      // 导入系统设置
      if (importData.system?.searchEngine) {
        await systemService.updateSearchEngine(
          importData.system.searchEngine as keyof typeof SearchEngineType
        );
      }

      // 导入背景图片
      if (importData.system?.backgroundImage) {
        const { base64, mimeType, id } = importData.system.backgroundImage;
        const blob = base64ToBlob(base64, mimeType);
        await db.putWithKey(STORE_NAMES.SYSTEM, "backgroundImage", {
          id,
          blob,
        });
      }

      toast.success("数据导入成功，请刷新页面");
      return true;
    } catch (error) {
      console.error("导入数据失败:", error);
      toast.error("导入数据失败，请检查文件格式");
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
