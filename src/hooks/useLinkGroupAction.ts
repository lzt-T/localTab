import { useCallback, useState } from "react";
import { linkGroupService } from "@/services/linkGroupService";
import { categoryItemService } from "@/services/categoryItemService";
import type { LinkGroup } from "@/type/db";

/** 管理网址分组的重命名弹窗与持久化操作。 */
export function useLinkGroupAction() {
  // 重命名弹窗是否打开
  const [isOpen, setIsOpen] = useState(false);
  // 当前正在编辑的网址分组
  const [editingLinkGroup, setEditingLinkGroup] = useState<LinkGroup | null>(
    null
  );

  /** 打开网址分组重命名弹窗。 */
  const onOpenEdit = useCallback((linkGroup: LinkGroup) => {
    setEditingLinkGroup(linkGroup);
    setIsOpen(true);
  }, []);

  /** 关闭网址分组重命名弹窗。 */
  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  /** 提交网址分组名称。 */
  const onSubmit = useCallback(
    async (name: string) => {
      if (!editingLinkGroup) {
        return;
      }
      await linkGroupService.updateLinkGroup(editingLinkGroup.id, name);
      setIsOpen(false);
    },
    [editingLinkGroup]
  );

  /** 删除网址分组并保留组内网址。 */
  const onDelete = useCallback(async (id: string) => {
    await categoryItemService.deleteFolder(id);
  }, []);

  return {
    isOpen,
    editingLinkGroup,
    onOpenEdit,
    onClose,
    onSubmit,
    onDelete,
  };
}
