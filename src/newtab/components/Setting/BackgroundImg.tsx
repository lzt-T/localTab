import React, { useRef } from "react";
import { useBackgroundImg } from "../../../hooks/useBackgroundImg";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function BackgroundImg() {
  const { backgroundImage, onUploadBackground, onDeleteBackground } = useBackgroundImg();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 触发文件选择
  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  // 处理文件上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    // 验证文件大小（例如：最大 10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("图片文件大小不能超过 10MB");
      return;
    }

    try {
      await onUploadBackground(file);
      toast.success("背景图片设置成功");
      // 清空文件输入，以便可以再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("上传背景图片失败:", error);
      toast.error("上传背景图片失败");
    }
  };

  // 处理删除背景图片
  const handleDeleteBackground = async () => {
    try {
      await onDeleteBackground();
      toast.success("背景图片已删除");
    } catch (error) {
      console.error("删除背景图片失败:", error);
      toast.error("删除背景图片失败");
    }
  };

  return (
    <div className="space-y-6">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* 上传按钮 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSelectImage}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 flex items-center gap-2 text-white border border-white/20"
        >
          <Upload size={18} />
          选择图片
        </button>

        {backgroundImage && (
          <button
            onClick={handleDeleteBackground}
            className="px-6 py-3 bg-red-500/30 hover:bg-red-500/40 rounded-lg transition-all duration-300 flex items-center gap-2 text-white border border-red-500/30"
          >
            <Trash2 size={18} />
            删除背景
          </button>
        )}
      </div>

      {/* 当前背景预览 */}
      {backgroundImage && (
        <div className="space-y-2">
          <div className="text-sm text-white/70">当前背景预览：</div>
          <div className="relative w-full h-64 rounded-lg overflow-hidden border border-white/20">
            <img
              src={backgroundImage}
              alt="背景预览"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 text-white">
                <ImageIcon size={20} />
                <span className="text-sm">背景图片</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      {!backgroundImage && (
        <div className="text-sm text-white/50 flex items-center gap-2">
          <ImageIcon size={16} />
          <span>尚未设置背景图片，点击"选择图片"按钮上传</span>
        </div>
      )}
    </div>
  );
}