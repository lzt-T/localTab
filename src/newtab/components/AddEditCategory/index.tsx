import { useState, useEffect, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import IconPickerGrid from "@/newtab/components/IconPickerGrid";
import { cn } from "@/lib/utils";

// 分类表单输入框统一样式
const FIELD_CLASS_NAME =
  "h-11 border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:border-blue-300/60 focus-visible:ring-blue-300/20";

// 分类名称错误信息标识
const CATEGORY_TITLE_ERROR_ID = "category-title-error";

// 分类图标错误信息标识
const CATEGORY_ICON_ERROR_ID = "category-icon-error";

interface AddEditCategoryProps {
  open: boolean;
  mode: "add" | "edit";
  initialData?: {
    title: string;
    icon: string;
  };
  canDelete?: boolean;
  handleClose: () => void;
  handleSubmit: (values: { title: string; icon: string }) => void;
  onDelete?: () => void;
}

/** 渲染新增与编辑分类弹窗。 */
export default function AddEditCategory({
  open,
  mode,
  initialData,
  canDelete = true,
  handleClose,
  handleSubmit,
  onDelete,
}: AddEditCategoryProps) {
  // 分类弹窗本地化文案
  const { t } = useTranslation();
  // 分类名称
  const [title, setTitle] = useState("");
  // 分类图标
  const [icon, setIcon] = useState("house");
  // 表单校验错误
  const [errors, setErrors] = useState<{ title?: string; icon?: string }>({});

  // 当前模式弹窗标题
  const dialogTitle = t(
    mode === "add" ? "category.addTitle" : "category.editTitle"
  );
  // 当前模式弹窗说明
  const dialogDescription = t(
    mode === "add" ? "category.addDescription" : "category.editDescription"
  );

  /** 更新分类名称并清除标题校验错误。 */
  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
    if (errors.title) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        title: undefined,
      }));
    }
  }

  /** 校验分类表单并返回是否有效。 */
  function validateForm() {
    // 当前校验错误集合
    const nextErrors: { title?: string; icon?: string } = {};

    if (!title.trim()) {
      nextErrors.title = t("category.nameRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  /** 提交分类表单并关闭弹窗。 */
  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
    handleSubmit({ title: title.trim(), icon });
    handleClose();
  }

  /** 同步弹窗关闭状态。 */
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      handleClose();
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    if (mode === "edit" && initialData) {
      setTitle(initialData.title);
      setIcon(initialData.icon);
    } else {
      setTitle("");
      setIcon("house");
    }
    setErrors({});
  }, [open, mode, initialData]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="shadow-2xl shadow-black/40 sm:max-w-[440px]">
        <form noValidate onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-title" className="text-white/80">
                {t("category.name")}
              </Label>
              <Input
                id="category-title"
                autoFocus
                placeholder={t("category.namePlaceholder")}
                value={title}
                onChange={handleTitleChange}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={
                  errors.title ? CATEGORY_TITLE_ERROR_ID : undefined
                }
                className={cn(
                  FIELD_CLASS_NAME,
                  errors.title && "border-red-400"
                )}
                maxLength={10}
              />
              {errors.title ? (
                <p
                  id={CATEGORY_TITLE_ERROR_ID}
                  className="text-xs text-red-300"
                >
                  {errors.title}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label className="text-white/80">{t("common.icon")}</Label>
              <IconPickerGrid
                value={icon}
                onChange={setIcon}
                label={t("category.selectIcon")}
                errorId={errors.icon ? CATEGORY_ICON_ERROR_ID : undefined}
                hasError={Boolean(errors.icon)}
              />
              {errors.icon ? (
                <p id={CATEGORY_ICON_ERROR_ID} className="text-xs text-red-300">
                  {errors.icon}
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter
            className={cn(
              mode === "edit" && onDelete && "sm:justify-between"
            )}
          >
            {mode === "edit" && onDelete ? (
              <Button
                type="button"
                variant="outline"
                disabled={!canDelete}
                title={!canDelete ? t("category.keepOne") : t("common.delete")}
                onClick={onDelete}
                className="cursor-pointer border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-white disabled:cursor-not-allowed sm:mr-auto"
              >
                <Trash2 size={15} />
                {t("common.delete")}
              </Button>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white"
                onClick={handleClose}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                className="cursor-pointer bg-blue-500/85 text-white hover:bg-blue-400 focus-visible:ring-blue-300/40"
              >
                {t("common.confirm")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
