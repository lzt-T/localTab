import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// 文件夹名称错误信息标识
const LINK_GROUP_NAME_ERROR_ID = "link-group-name-error";

interface EditLinkGroupProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

/** 渲染新建网址分组弹窗。 */
export default function EditLinkGroup({
  open,
  onClose,
  onSubmit,
}: EditLinkGroupProps) {
  // 弹窗的本地化文案
  const { t } = useTranslation();
  // 当前输入的网址分组名称
  const [name, setName] = useState("");
  // 名称校验错误
  const [error, setError] = useState("");

  /** 同步输入值并清除校验错误。 */
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setError("");
  };

  /** 校验并提交新建的网址分组名称。 */
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 去除首尾空格后的网址分组名称
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("linkGroup.nameRequired"));
      return;
    }
    await onSubmit(trimmedName);
  };

  /** 同步弹窗关闭操作。 */
  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="shadow-2xl shadow-black/40 sm:max-w-[425px]">
        <form noValidate onSubmit={(event) => void handleFormSubmit(event)}>
          <DialogHeader>
            <DialogTitle>{t("linkGroup.createTitle")}</DialogTitle>
            <DialogDescription>
              {t("linkGroup.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-4">
            <Label htmlFor="link-group-name" className="text-white/80">
              {t("linkGroup.name")}
            </Label>
            <Input
              id="link-group-name"
              value={name}
              onChange={onNameChange}
              maxLength={30}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? LINK_GROUP_NAME_ERROR_ID : undefined}
              className={cn(
                "h-11 border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:border-blue-300/60 focus-visible:ring-blue-300/20",
                error && "border-red-400"
              )}
              autoFocus
            />
            {error ? (
              <p
                id={LINK_GROUP_NAME_ERROR_ID}
                className="text-xs text-red-300"
              >
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white"
                onClick={onClose}
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
