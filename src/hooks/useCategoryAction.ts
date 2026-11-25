import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { categoryService } from "@/services/categoryService";
import { toast } from "sonner";
import type { CategoryInfo } from "@/type/db";

interface CategoryActionState {
  mode: "add" | "edit";
  categoryId?: string;
  initialData?: {
    title: string;
    icon: string;
  };
}

/** 管理分类的添加、编辑和删除操作。 */
export function useCategoryAction(categories: CategoryInfo[] = []) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [actionState, setActionState] = useState<CategoryActionState>({
    mode: "add",
  });
  const categoriesRef = useRef(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  /** 打开新增分类弹窗。 */
  const onOpenAdd = useCallback(() => {
    setActionState({
      mode: "add",
    });
    setIsOpen(true);
  }, []);

  /** 打开编辑分类弹窗：优先读取内存分类数据实现瞬开，未命中回退查库。 */
  const onOpenEdit = useCallback(async (categoryId: string) => {
    const cachedCategory = categoriesRef.current.find(
      (item) => item.id === categoryId
    );
    if (cachedCategory) {
      setActionState({
        mode: "edit",
        categoryId,
        initialData: {
          title: cachedCategory.name,
          icon: cachedCategory.icon,
        },
      });
      setIsOpen(true);
      return;
    }

    const category = await categoryService.getCategory(categoryId);
    if (!category) return;
    setActionState({
      mode: "edit",
      categoryId,
      initialData: {
        title: category.name,
        icon: category.icon,
      },
    });
    setIsOpen(true);
  }, []);

  /** 删除指定分类。 */
  const onDeleteCategory = useCallback(
    async (categoryId: string) => {
      const length = await categoryService.getCategoryCount();
      if (length === 1) {
        toast.warning(t("category.keepOne"));
        return;
      }

      await categoryService.deleteCategory(categoryId);
    },
    [t]
  );

  /** 关闭分类弹窗。 */
  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  /** 提交分类表单。 */
  const onSubmit = useCallback(
    async (values: { title: string; icon: string }) => {
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
    },
    [actionState]
  );

  return {
    isOpen,
    mode: actionState.mode,
    categoryId: actionState.categoryId,
    initialData: actionState.initialData,
    onOpenAdd,
    onOpenEdit,
    onDeleteCategory,
    onClose,
    onSubmit,
  };
}
