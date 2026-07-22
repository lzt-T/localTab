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
import FileDropZone from "@/newtab/components/Setting/FileDropZone";

export default function DataManagement() {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { isExporting, isImporting, onExport, onImport } = useDataManagement();

  // 处理文件选择
  const handleFileSelect = (file: File) => {
    // 验证文件类型
    if (!file.type.includes("json") && !file.name.endsWith(".json")) {
      toast.error(t("dataManagement.selectJson"));
      return;
    }

    setSelectedFile(file);
    setIsDialogOpen(true);
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setIsDialogOpen(false);
    const success = await onImport(selectedFile);

    if (success) {
      setSelectedFile(null);
    }
  };

  // 取消导入
  const handleCancelImport = () => {
    setIsDialogOpen(false);
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
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
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 flex items-center gap-2 text-white border border-white/20 cursor-pointer"
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
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl text-white border-white/10">
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
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleConfirmImport}
              className="bg-red-500/30 hover:bg-red-500/40 text-white border border-red-500/30"
            >
              {t("dataManagement.confirmImport")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
