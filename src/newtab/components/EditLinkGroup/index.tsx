import { useEffect, useState } from "react";
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

interface EditLinkGroupProps {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

/** 渲染网址分组重命名弹窗。 */
export default function EditLinkGroup({
  open,
  initialName,
  onClose,
  onSubmit,
}: EditLinkGroupProps) {
  // 弹窗的本地化文案
  const { t } = useTranslation();
  // 当前输入的网址分组名称
  const [name, setName] = useState(initialName);
  // 名称校验错误
  const [error, setError] = useState("");

  /** 同步输入值并清除校验错误。 */
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setError("");
  };

  /** 校验并提交网址分组名称。 */
  const onConfirm = async () => {
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

  useEffect(() => {
    if (open) {
      setName(initialName);
      setError("");
    }
  }, [initialName, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/15 bg-[rgba(32,34,38,0.92)] text-white shadow-2xl shadow-black/40 backdrop-blur-2xl sm:max-w-[425px] [&_[data-slot=dialog-close]]:bg-transparent [&_[data-slot=dialog-close]]:text-white/70 [&_[data-slot=dialog-close]]:hover:bg-white/10 [&_[data-slot=dialog-close]]:hover:text-white">
        <DialogHeader>
          <DialogTitle>{t("linkGroup.editTitle")}</DialogTitle>
          <DialogDescription className="text-white/60">
            {t("linkGroup.editDescription")}
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
            maxLength={10}
            className="border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:border-blue-300/60 focus-visible:ring-blue-300/20"
            autoFocus
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            {t("common.cancel")}
          </Button>
          <Button
            className="cursor-pointer bg-blue-500/80 text-white hover:bg-blue-400"
            onClick={() => void onConfirm()}
          >
            {t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
