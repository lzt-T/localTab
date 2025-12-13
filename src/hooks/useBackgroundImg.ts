import useSystemStore from "../store/systemStore";
import { useEffect } from "react";
import { backgroundService } from "../services/backgroundService";

export function useBackgroundImg() {
  const changeBackgroundImage = useSystemStore(
    (state) => state.changeBackgroundImage
  );
  const changeIsInitializedBackgroundImage = useSystemStore(
    (state) => state.changeIsInitializedBackgroundImage
  );
  const backgroundImage = useSystemStore((state) => state.backgroundImage);
  const backgroundImageId = useSystemStore((state) => state.backgroundImageId);
  const changeBackgroundImageId = useSystemStore(
    (state) => state.changeBackgroundImageId
  );
  /* 加载背景图片 */
  const onLoadBackground = async () => {
    try {
      const url = await backgroundService.getBackgroundImageUrl();

      if (backgroundImageId === url?.id) {
        return;
      }

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
  };

  /* 上传背景图片 */
  const onUploadBackground = async (file: File) => {
    try {
      // 保存背景图片，存入blob 到数据库
      const blob = new Blob([file], { type: file.type });
      const id = await backgroundService.saveBackgroundImage(blob);
      const imageUrl = URL.createObjectURL(file);
      changeBackgroundImageId(id);
      changeBackgroundImage(imageUrl);
    } catch (error) {
      console.error("保存背景图片失败:", error);
      const message =
        error instanceof Error ? error.message : "保存背景图片失败";
      alert(message);
    }
  };

  /* 删除背景图片 */
  const onDeleteBackground = async () => {
    await backgroundService.deleteBackgroundImage();
    changeBackgroundImage("");
    changeBackgroundImageId("");
  };

  useEffect(() => {
    const init = async () => {
      const hasBackgroundImage = await backgroundService.hasBackgroundImage();
      if (hasBackgroundImage) {
        await onLoadBackground();
      }
      changeIsInitializedBackgroundImage(true);
    };
    init();
  }, []);

  return {
    backgroundImage,
    onLoadBackground,
    onUploadBackground,
    onDeleteBackground,
  };
}
