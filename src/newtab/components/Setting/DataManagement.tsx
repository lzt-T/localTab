import React, { useRef, useState } from "react";
import { Download, Upload, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { useDataManagement } from "../../../hooks/useDataManagement";

export default function DataManagement() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { isExporting, isImporting, onExport, onImport } = useDataManagement();

  // 触发文件选择
  const onSelectFile = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.includes("json") && !file.name.endsWith(".json")) {
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

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (success) {
      setSelectedFile(null);
    }
  };

  // 取消导入
  const handleCancelImport = () => {
    setIsDialogOpen(false);
    setSelectedFile(null);
    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* 导出数据 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">导出数据</h3>
          <p className="text-sm text-white/60 mb-4">
            将当前所有数据导出为 JSON 文件，包括分类、链接、链接组和系统设置
          </p>
          <Button
            onClick={onExport}
            disabled={isExporting}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 flex items-center gap-2 text-white border border-white/20 cursor-pointer"
          >
            <Download size={18} />
            {isExporting ? "导出中..." : "导出数据"}
          </Button>
        </div>
      </div>

      {/* 导入数据 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">导入数据</h3>
          <p className="text-sm text-white/60 mb-4">
            从 JSON 文件导入数据，将覆盖现有数据
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            onClick={onSelectFile}
            disabled={isImporting}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 flex items-center gap-2 text-white border border-white/20 cursor-pointer"
          >
            <Upload size={18} />
            {isImporting ? "导入中..." : "导入数据"}
          </Button>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
          <div className="text-sm text-white/80">
            <p className="font-medium mb-1">注意事项：</p>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>导入数据会覆盖现有所有数据，请谨慎操作</li>
              <li>建议在导入前先导出当前数据作为备份</li>
              <li>导入成功后需要刷新页面才能看到效果</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 确认导入对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl text-white border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">确认导入数据</DialogTitle>
            <DialogDescription className="text-white/70">
              导入数据将覆盖现有所有数据，此操作不可恢复。是否继续？
            </DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="text-sm text-white/60">
              <p>文件名称：{selectedFile.name}</p>
              <p>文件大小：{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleCancelImport}
              variant="outline"
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              取消
            </Button>
            <Button
              onClick={handleConfirmImport}
              className="bg-red-500/30 hover:bg-red-500/40 text-white border border-red-500/30"
            >
              确认导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
