import { useState, useCallback } from "react";
import { linkService } from "@/services/linkService";
import { linkGroupService } from "@/services/linkGroupService";
import { categoryItemService } from "@/services/categoryItemService";

interface LinkActionState {
  mode: "add" | "edit";
  linkId?: string;
  initialData?: {
    title: string;
    description: string;
    url: string;
    icon: string;
    categoryId: string;
    linkGroupId: string;
  };
  defaultParentId?: string;
}

/** 管理网址添加、编辑和删除操作。 */
export function useLinkAction() {
  // 网址编辑抽屉是否打开
  const [isOpen, setIsOpen] = useState(false);
  // 当前网址操作状态
  const [actionState, setActionState] = useState<LinkActionState>({
    mode: "add",
  });

  /* 打开新增模式 */
  const onOpenAdd = useCallback((defaultParentId: string) => {
    setActionState({
      mode: "add",
      defaultParentId,
    });
    setIsOpen(true);
  }, []);

  /* 打开编辑模式 */
  const onOpenEdit = useCallback(async (linkId: string) => {
    // 待编辑的网址
    const link = await linkService.getLink(linkId);
    if (!link) {
      return;
    }
    // 网址当前所属的分组
    const linkGroup = await linkGroupService.getLinkGroup(link.parentId);
    setActionState({
      mode: "edit",
      linkId: linkId,
      initialData: {
        title: link.title,
        description: link.description,
        url: link.url,
        icon: link.icon,
        categoryId: linkGroup?.parentId ?? link.parentId,
        linkGroupId: linkGroup?.id ?? "",
      },
    });
    setIsOpen(true);
  }, []);

  /* 删除链接 */
  const onDeleteLink = useCallback(async (linkId: string) => {
    await categoryItemService.deleteLink(linkId);
  }, []);

  /* 打开关闭抽屉 */
  const onChangeOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  /* 关闭抽屉 */
  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  /* 提交链接 */
  const onSubmit = useCallback(
    async (values: {
      title: string;
      description: string;
      url: string;
      icon: string;
      parentId: string;
    }) => {
      if (actionState.mode === "add") {
        // 新增链接
        await categoryItemService.createLink({
          parentId: values.parentId,
          title: values.title,
          description: values.description,
          url: values.url,
          icon: values.icon,
        });
      } else {
        // 待编辑的网址
        const existingLink = await linkService.getLink(actionState.linkId!);
        if (!existingLink) {
          return;
        }
        // 编辑网址自身字段时先保留原父级和排序
        await linkService.updateLink({
          id: actionState.linkId,
          parentId: existingLink.parentId,
          title: values.title,
          description: values.description,
          url: values.url,
          icon: values.icon,
        });
        if (existingLink.parentId !== values.parentId) {
          // 目标父级对应的文件夹
          const targetLinkGroup = await linkGroupService.getLinkGroup(
            values.parentId
          );
          // 目标父级的末尾位置
          const targetIndex = targetLinkGroup
            ? (await linkService.getLinkCountByParentId(values.parentId)).length
            : (await categoryItemService.getCategoryItems(values.parentId)).length;
          await categoryItemService.moveLink(
            existingLink.id,
            values.parentId,
            targetIndex
          );
        }
      }
    },
    [actionState]
  );

  return {
    isOpen,
    mode: actionState.mode,
    initialData: actionState.initialData,
    defaultParentId: actionState.defaultParentId,
    onChangeOpen,
    onOpenAdd,
    onOpenEdit,
    onDeleteLink,
    onClose,
    onSubmit,
  };
}
