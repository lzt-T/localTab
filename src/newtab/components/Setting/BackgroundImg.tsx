import { Trash2, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBackgroundImg } from "@/hooks/useBackgroundImg";
import FileDropZone from "@/newtab/components/Setting/FileDropZone";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export default function BackgroundImg() {
  const { t } = useTranslation();
  const { backgroundImage, onUploadBackground, onDeleteBackground } =
    useBackgroundImg();

  // 处理文件上传
  const handleImageFile = async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast.error(t("wallpaper.selectImageFile"));
      return;
    }

    // 验证文件大小
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t("wallpaper.imageTooLarge"));
      return;
    }

    try {
      await onUploadBackground(file);
      toast.success(t("wallpaper.setSuccess"));
    } catch (error) {
      console.error("上传背景图片失败:", error);
      toast.error(t("wallpaper.uploadFailed"));
    }
  };

  // 处理删除背景图片
  const handleDeleteBackground = async () => {
    try {
      await onDeleteBackground();
      toast.success(t("wallpaper.deleted"));
    } catch (error) {
      console.error("删除背景图片失败:", error);
      toast.error(t("wallpaper.deleteFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <FileDropZone
        accept="image/*"
        title={t("wallpaper.selectImage")}
        description={t("wallpaper.supportedFormats")}
        onFileSelect={handleImageFile}
      />

      {/* 当前背景预览 */}
      {backgroundImage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">
              {t("wallpaper.currentPreview")}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteBackground}
              className="cursor-pointer border-red-400/25 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-white"
            >
              <Trash2 size={16} />
              {t("wallpaper.deleteBackground")}
            </Button>
          </div>
          <div className="relative w-full h-64 rounded-lg overflow-hidden border border-white/20">
            <img
              src={backgroundImage}
              alt={t("wallpaper.previewAlt")}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 text-white">
                <ImageIcon size={20} />
                <span className="text-sm">{t("wallpaper.backgroundImage")}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      {!backgroundImage && (
        <div className="text-sm text-white/50 flex items-center gap-2">
          <ImageIcon size={16} />
          <span>{t("wallpaper.notSet")}</span>
        </div>
      )}
    </div>
  );
}
