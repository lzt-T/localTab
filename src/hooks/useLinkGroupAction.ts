import { useCallback, useState } from "react";
import { linkGroupService } from "@/services/linkGroupService";
import { categoryItemService } from "@/services/categoryItemService";
import type { LinkGroup } from "@/type/db";

// 文件夹弹窗的操作模式
type LinkGroupActionMode = "create" | "edit";

/** 管理网址分组的新建、重命名弹窗与持久化操作。 */
export function useLinkGroupAction() {
  // 重命名弹窗是否打开
  const [isOpen, setIsOpen] = useState(false);
  // 当前正在编辑的网址分组
  const [editingLinkGroup, setEditingLinkGroup] = useState<LinkGroup | null>(
    null
  );
  // 当前文件夹弹窗操作模式
  const [mode, setMode] = useState<LinkGroupActionMode>("edit");
  // 新建文件夹所属分类标识
  const [targetCategoryId, setTargetCategoryId] = useState("");

  /** 打开新建网址分组弹窗。 */
  const onOpenCreate = useCallback((categoryId: string) => {
    setEditingLinkGroup(null);
    setTargetCategoryId(categoryId);
    setMode("create");
    setIsOpen(true);
  }, []);

  /** 打开网址分组重命名弹窗。 */
  const onOpenEdit = useCallback((linkGroup: LinkGroup) => {
    setEditingLinkGroup(linkGroup);
    setTargetCategoryId(linkGroup.parentId);
    setMode("edit");
    setIsOpen(true);
  }, []);

  /** 关闭网址分组重命名弹窗。 */
  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  /** 提交网址分组名称。 */
  const onSubmit = useCallback(
    async (name: string) => {
      // 不同文件夹操作模式对应的持久化策略
      const submitStrategies: Record<LinkGroupActionMode, () => Promise<void>> = {
        create: async () => {
          await categoryItemService.createFolder(name, targetCategoryId);
        },
        edit: async () => {
          if (editingLinkGroup) {
            await linkGroupService.updateLinkGroup(editingLinkGroup.id, name);
          }
        },
      };
      if (mode === "create" && !targetCategoryId) {
        return;
      }
      await submitStrategies[mode]();
      setIsOpen(false);
    },
    [editingLinkGroup, mode, targetCategoryId]
  );

  /** 删除网址分组并保留组内网址。 */
  const onDelete = useCallback(async (id: string) => {
    await categoryItemService.deleteFolder(id);
  }, []);

  return {
    isOpen,
    mode,
    editingLinkGroup,
    onOpenCreate,
    onOpenEdit,
    onClose,
    onSubmit,
    onDelete,
  };
}
