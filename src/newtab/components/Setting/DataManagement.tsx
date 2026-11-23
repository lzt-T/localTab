import { useState } from "react";
import { Download, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDataManagement } from "@/hooks/useDataManagement";
import BrowserBookmarkImport from "@/newtab/components/Setting/BrowserBookmarkImport";
import FileDropZone from "@/newtab/components/Setting/FileDropZone";

/** 数据管理区域参数。 */
interface DataManagementProps {
  onDataChanged: () => Promise<void>;
}

/** 渲染浏览器书签导入和 LocalTab 备份管理。 */
export default function DataManagement({ onDataChanged }: DataManagementProps) {
  // 数据管理界面的本地化工具
  const { t } = useTranslation();
  // 导入确认弹窗是否打开
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // 当前等待导入的备份文件
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // 数据导入导出的状态与操作
  const { isExporting, isImporting, onExport, onImport } = useDataManagement();

  /** 校验并暂存用户选择的备份文件。 */
  const handleFileSelect = (file: File) => {
    // 验证文件类型
    if (!file.type.includes("json") && !file.name.endsWith(".json")) {
      toast.error(t("dataManagement.selectJson"));
      return;
    }

    setSelectedFile(file);
    setIsDialogOpen(true);
  };

  /** 确认导入并在成功后刷新页面。 */
  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setIsDialogOpen(false);
    // 当前备份是否成功导入
    const success = await onImport(selectedFile);

    if (success) {
      setSelectedFile(null);
      window.location.reload();
    }
  };

  /** 取消当前导入操作。 */
  const handleCancelImport = () => {
    setIsDialogOpen(false);
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
      <BrowserBookmarkImport onDataChanged={onDataChanged} />

      {/* 导出数据 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">
            {t("dataManagement.exportTitle")}
          </h3>
          <p className="text-sm text-white/60 mb-4">
            {t("dataManagement.exportDescription")}
          </p>
          <Button
            onClick={onExport}
            disabled={isExporting}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-6 py-3 text-white transition-colors hover:bg-white/15"
          >
            <Download size={18} />
            {isExporting
              ? t("dataManagement.exporting")
              : t("dataManagement.exportTitle")}
          </Button>
        </div>
      </div>

      {/* 导入数据 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">
            {t("dataManagement.importTitle")}
          </h3>
          <p className="text-sm text-white/60 mb-4">
            {t("dataManagement.importDescription")}
          </p>
          <FileDropZone
            accept=".json,application/json"
            title={
              isImporting
                ? t("dataManagement.importing")
                : t("dataManagement.dropJson")
            }
            description={t("dataManagement.backupOnly")}
            disabled={isImporting}
            onFileSelect={handleFileSelect}
          />
        </div>
      </div>

      {/* 提示信息 */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
          <div className="text-sm text-white/80">
            <p className="font-medium mb-1">
              {t("dataManagement.cautionsTitle")}
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>{t("dataManagement.cautionOverwrite")}</li>
              <li>{t("dataManagement.cautionBackup")}</li>
              <li>{t("dataManagement.cautionRefresh")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 确认导入对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("dataManagement.confirmImportTitle")}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {t("dataManagement.confirmImportDescription")}
            </DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="text-sm text-white/60">
              <p>
                {t("dataManagement.fileName", { name: selectedFile.name })}
              </p>
              <p>
                {t("dataManagement.fileSize", {
                  size: (selectedFile.size / 1024).toFixed(2),
                })}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleCancelImport}
              variant="outline"
              className="cursor-pointer border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleConfirmImport}
              variant="destructive"
              className="cursor-pointer border border-red-400/30 bg-red-500/70 text-white hover:bg-red-500/90 focus-visible:ring-red-300/30 dark:bg-red-500/70 dark:hover:bg-red-500/90"
            >
              {t("dataManagement.confirmImport")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
