import { useCallback, useState } from "react";
import { linkGroupService } from "@/services/linkGroupService";
import { categoryItemService } from "@/services/categoryItemService";

/** 管理网址分组的新建弹窗、重命名与删除操作。 */
export function useLinkGroupAction() {
  // 新建文件夹弹窗是否打开
  const [isOpen, setIsOpen] = useState(false);
  // 新建文件夹所属分类标识
  const [targetCategoryId, setTargetCategoryId] = useState("");

  /** 打开新建网址分组弹窗。 */
  const onOpenCreate = useCallback((categoryId: string) => {
    setTargetCategoryId(categoryId);
    setIsOpen(true);
  }, []);

  /** 关闭新建网址分组弹窗。 */
  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  /** 创建网址分组并关闭弹窗。 */
  const onCreate = useCallback(
    async (name: string) => {
      if (!targetCategoryId) {
        return;
      }
      await categoryItemService.createFolder(name, targetCategoryId);
      setIsOpen(false);
    },
    [targetCategoryId]
  );

  /** 更新网址分组名称。 */
  const onRename = useCallback(async (id: string, name: string) => {
    await linkGroupService.updateLinkGroup(id, name);
  }, []);

  /** 删除网址分组并保留组内网址。 */
  const onDelete = useCallback(async (id: string) => {
    await categoryItemService.deleteFolder(id);
  }, []);

  return {
    isOpen,
    targetCategoryId,
    onOpenCreate,
    onClose,
    onCreate,
    onRename,
    onDelete,
  };
}
