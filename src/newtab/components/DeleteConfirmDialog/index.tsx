import React from "react";
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

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  itemName: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  itemName,
  onConfirm,
  confirmText,
  cancelText,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="shadow-2xl shadow-black/40 [&_[data-slot=dialog-close]]:bg-transparent [&_[data-slot=dialog-close]]:text-white/70 [&_[data-slot=dialog-close]]:hover:bg-white/10 [&_[data-slot=dialog-close]]:hover:text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-white/60">
            {t("deleteDialog.description", { itemName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
          >
            {cancelText ?? t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="cursor-pointer border border-red-400/30 bg-red-500/70 text-white hover:bg-red-500/90 focus-visible:ring-red-300/30 dark:bg-red-500/70 dark:hover:bg-red-500/90"
          >
            {confirmText ?? t("deleteDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
