import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { systemService } from "@/services/systemService";
import type { CategoryInfo, Link } from "@/type/db";

/** 收集分类及文件夹中的全部网址。 */
function getAllLinks(categories: CategoryInfo[]): Link[] {
  return categories.flatMap((category) => [
    ...category.links,
    ...category.linkGroups.flatMap((linkGroup) => linkGroup.links),
  ]);
}

/** 判断两个网址标识列表是否一致。 */
function areLinkIdsEqual(firstIds: string[], secondIds: string[]): boolean {
  return (
    firstIds.length === secondIds.length &&
    firstIds.every((linkId, index) => linkId === secondIds[index])
  );
}

/** 管理 Dock 固定网址的读取、排序和持久化。 */
export function useDockLinks(categories: CategoryInfo[]) {
  // Dock 文案的本地化工具
  const { t } = useTranslation();
  // Dock 中固定的网址标识
  const [dockLinkIds, setDockLinkIds] = useState<string[]>([]);
  // Dock 配置是否已经读取
  const [isDockInitialized, setIsDockInitialized] = useState(false);
  // 页面当前可用的全部网址
  const allLinks = getAllLinks(categories);
  // 网址标识对应的网址数据
  const linkById = new Map(allLinks.map((link) => [link.id, link]));
  // 按固定顺序展示的 Dock 网址
  const dockLinks = dockLinkIds.flatMap((linkId) => {
    // 当前固定标识对应的网址
    const link = linkById.get(linkId);
    return link ? [link] : [];
  });
  /** 保存并更新 Dock 网址标识。 */
  async function saveDockLinkIds(nextDockLinkIds: string[]) {
    setDockLinkIds(nextDockLinkIds);
    await systemService.updateDockLinkIds(nextDockLinkIds);
  }

  /** 将网址固定到 Dock。 */
  async function pinDockLink(linkId: string) {
    if (dockLinkIds.includes(linkId)) {
      toast.info(t("dock.alreadyPinned"));
      return;
    }
    await saveDockLinkIds([...dockLinkIds, linkId]);
    toast.success(t("dock.pinned"));
  }

  /** 调整 Dock 网址顺序。 */
  async function moveDockLink(linkId: string, targetIndex: number) {
    // 当前网址在 Dock 中的位置
    const sourceIndex = dockLinkIds.indexOf(linkId);
    if (sourceIndex < 0 || sourceIndex === targetIndex) {
      return;
    }

    // 移除拖动网址后的标识列表
    const reorderedLinkIds = dockLinkIds.filter((id) => id !== linkId);
    // 限制后的目标位置
    const insertIndex = Math.max(
      0,
      Math.min(targetIndex, reorderedLinkIds.length)
    );
    reorderedLinkIds.splice(insertIndex, 0, linkId);
    await saveDockLinkIds(reorderedLinkIds);
  }

  /** 从 Dock 取消固定网址。 */
  async function unpinDockLink(linkId: string) {
    await saveDockLinkIds(dockLinkIds.filter((id) => id !== linkId));
    toast.success(t("dock.unpinned"));
  }

  useEffect(() => {
    /** 读取已保存的 Dock 网址标识。 */
    async function loadDockLinkIds() {
      // 已保存的 Dock 网址标识
      const savedDockLinkIds = await systemService.getDockLinkIds();
      setDockLinkIds(savedDockLinkIds);
      setIsDockInitialized(true);
    }

    void loadDockLinkIds();
  }, []);

  useEffect(() => {
    if (!isDockInitialized || categories.length === 0) {
      return;
    }

    // 页面当前仍然存在的网址标识
    const availableLinkIds = new Set(
      getAllLinks(categories).map((link) => link.id)
    );
    // 仍然存在于页面数据中的 Dock 网址标识
    const validDockLinkIds = dockLinkIds.filter((linkId) =>
      availableLinkIds.has(linkId)
    );
    if (!areLinkIdsEqual(dockLinkIds, validDockLinkIds)) {
      setDockLinkIds(validDockLinkIds);
      void systemService.updateDockLinkIds(validDockLinkIds);
    }
  }, [categories, dockLinkIds, isDockInitialized]);

  return {
    dockLinks,
    pinDockLink,
    moveDockLink,
    unpinDockLink,
  };
}
