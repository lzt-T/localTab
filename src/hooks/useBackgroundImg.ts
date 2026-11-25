import useSystemStore from "@/store/systemStore";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { systemService } from "@/services/systemService";
import { notifyWorkspaceDataChanged } from "@/utils/broadcastSync";

// 确保背景初始化逻辑在整个应用生命周期只触发一次
let isBackgroundInitStarted = false;

/** 管理壁纸读取、上传、删除以及轻量标识校验。 */
export function useBackgroundImg() {
  const { t } = useTranslation();
  const changeBackgroundImage = useSystemStore(
    (state) => state.changeBackgroundImage
  );
  const changeIsInitializedBackgroundImage = useSystemStore(
    (state) => state.changeIsInitializedBackgroundImage
  );
  const backgroundImage = useSystemStore((state) => state.backgroundImage);
  const changeBackgroundImageId = useSystemStore(
    (state) => state.changeBackgroundImageId
  );

  /** 比对轻量壁纸标识，仅在壁纸真实变更时读取 Blob 并生成 ObjectURL。 */
  const onLoadBackground = useCallback(async () => {
    try {
      const latestId = await systemService.getBackgroundImageId();
      const currentId = useSystemStore.getState().backgroundImageId;

      if (currentId === latestId) {
        return;
      }

      if (!latestId) {
        changeBackgroundImage("");
        changeBackgroundImageId("");
        return;
      }

      const url = await systemService.getBackgroundImageUrl();
      if (url) {
        changeBackgroundImage(url.url);
        changeBackgroundImageId(url.id);
      } else {
        changeBackgroundImage("");
        changeBackgroundImageId("");
      }
    } catch (error) {
      console.error("加载背景图片失败:", error);
    }
  }, [changeBackgroundImage, changeBackgroundImageId]);

  /** 上传并保存背景图片，同时广播壁纸变更事件。 */
  const onUploadBackground = useCallback(
    async (file: File) => {
      try {
        // 保存背景图片，存入 blob 到数据库
        const blob = new Blob([file], { type: file.type });
        const id = await systemService.saveBackgroundImage(blob);
        const imageUrl = URL.createObjectURL(file);
        changeBackgroundImageId(id);
        changeBackgroundImage(imageUrl);
        notifyWorkspaceDataChanged("wallpaper");
      } catch (error) {
        console.error("保存背景图片失败:", error);
        alert(t("wallpaper.saveFailed"));
      }
    },
    [changeBackgroundImage, changeBackgroundImageId, t]
  );

  /** 删除背景图片并广播壁纸变更事件。 */
  const onDeleteBackground = useCallback(async () => {
    await systemService.deleteBackgroundImage();
    changeBackgroundImage("");
    changeBackgroundImageId("");
    notifyWorkspaceDataChanged("wallpaper");
  }, [changeBackgroundImage, changeBackgroundImageId]);

  useEffect(() => {
    if (
      isBackgroundInitStarted ||
      useSystemStore.getState().isInitializedBackgroundImage
    ) {
      return;
    }
    isBackgroundInitStarted = true;

    const init = async () => {
      await onLoadBackground();
      changeIsInitializedBackgroundImage(true);
    };
    void init();
  }, [changeIsInitializedBackgroundImage, onLoadBackground]);

  return {
    backgroundImage,
    onLoadBackground,
    onUploadBackground,
    onDeleteBackground,
  };
}
