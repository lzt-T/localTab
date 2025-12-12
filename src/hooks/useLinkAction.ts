import { useState, useCallback } from "react";
import { linkService } from "../services/linkService";

interface LinkActionState {
  mode: "add" | "edit";
  linkId?: string;
  initialData?: {
    title: string;
    description: string;
    url: string;
    icon: string;
  };
}

export function useLinkAction() {
  const [isOpen, setIsOpen] = useState(false);
  const [actionState, setActionState] = useState<LinkActionState>({
    mode: "add",
  });

  /* 打开新增模式 */
  const onOpenAdd = useCallback(() => {
    setActionState({
      mode: "add",
    });
    setIsOpen(true);
  }, []);

  /* 打开编辑模式 */
  const onOpenEdit = useCallback(async (linkId: string) => {
    const link = await linkService.getLink(linkId);
    if (!link) return;
    setActionState({
      mode: "edit",
      linkId: linkId,
      initialData: {
        title: link.title,
        description: link.description,
        url: link.url,
        icon: link.icon,
      },
    });
    setIsOpen(true);
  }, []);

  /* 删除链接 */
  const onDeleteLink = useCallback(async (linkId: string) => {
    await linkService.deleteLink(linkId);
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
        await linkService.updateLink({
          parentId: values.parentId,
          title: values.title,
          description: values.description,
          url: values.url,
          icon: values.icon,
        });
      } else {
        // 编辑链接
        await linkService.updateLink({
          id: actionState.linkId,
          parentId: values.parentId,
          title: values.title,
          description: values.description,
          url: values.url,
          icon: values.icon,
        });
      }
    },
    [actionState]
  );

  return {
    isOpen,
    mode: actionState.mode,
    initialData: actionState.initialData,
    onChangeOpen,
    onOpenAdd,
    onOpenEdit,
    onDeleteLink,
    onClose,
    onSubmit,
  };
}
