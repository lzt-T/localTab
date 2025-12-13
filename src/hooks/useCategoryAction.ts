import { useState } from "react";
import { categoryService } from "../services/categoryService";
import { toast } from "sonner";

interface CategoryActionState {
  mode: "add" | "edit";
  categoryId?: string;
  initialData?: {
    title: string;
    icon: string;
  };
}

export function useCategoryAction() {
  const [isOpen, setIsOpen] = useState(false);
  const [actionState, setActionState] = useState<CategoryActionState>({
    mode: "add",
  });

  // 打开新增模式
  const onOpenAdd = () => {
    setActionState({
      mode: "add",
    });
    setIsOpen(true);
  };

  // 打开编辑模式
  const onOpenEdit = async (categoryId: string) => {
    const category = await categoryService.getCategory(categoryId);
    if (!category) return;
    setActionState({
      mode: "edit",
      categoryId: categoryId,
      initialData: {
        title: category.name,
        icon: category.icon,
      },
    });
    setIsOpen(true);
  };

  // 删除分类
  const onDeleteCategory = async (categoryId: string) => {
    const length = await categoryService.getCategoryCount();
    if (length === 1) {
      toast.warning("至少保留一个分类");
      return;
    }

    await categoryService.deleteCategory(categoryId);
  };

  // 关闭弹窗
  const onClose = () => {
    setIsOpen(false);
  };

  // 提交表单
  const onSubmit = async (values: { title: string; icon: string }) => {
    if (actionState.mode === "add") {
      // 新增分类
      await categoryService.createCategory({
        name: values.title,
        icon: values.icon,
      });
    } else {
      await categoryService.updateCategory(actionState.categoryId || "", {
        name: values.title,
        icon: values.icon,
      });
    }
  };

  return {
    isOpen,
    mode: actionState.mode,
    initialData: actionState.initialData,
    onOpenAdd,
    onOpenEdit,
    onDeleteCategory,
    onClose,
    onSubmit,
  };
}
