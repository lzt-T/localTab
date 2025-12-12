import useSystemStore from '../store/systemStore';
import { useEffect, useState } from 'react';
import { backgroundService } from '../services/backgroundService';

export function useBackgroundImg() {
  const changeIsInitializedBackgroundImage = useSystemStore((state) => state.changeIsInitializedBackgroundImage);
  const [backgroundImage, setBackgroundImage] = useState<string>('');

  /* 加载背景图片 */
  const onLoadBackground = async () => {
    try {
      const url = await backgroundService.getBackgroundImageUrl();
      console.log(url, 'blob');
      if (url) {
        setBackgroundImage(url);
      }
    } catch (error) {
      console.error('加载背景图片失败:', error);
    }
  };


  /* 上传背景图片 */
  const onUploadBackground = async (file: File) => {

    try {
      // 保存背景图片，存入blob 到数据库
      const blob = new Blob([file], { type: file.type });
      await backgroundService.saveBackgroundImage(blob);
      const imageUrl = URL.createObjectURL(file);
      setBackgroundImage(imageUrl);
    } catch (error) {
      console.error('保存背景图片失败:', error);
      const message = error instanceof Error ? error.message : '保存背景图片失败';
      alert(message);
    }
  };

  /* 删除背景图片 */
  const onDeleteBackground = async () => {
    await backgroundService.deleteBackgroundImage();
    setBackgroundImage('');
  };

  useEffect(() => {
    const init = async () => {
      const hasBackgroundImage = await backgroundService.hasBackgroundImage();
      if (hasBackgroundImage) {
        await onLoadBackground();
      }
      changeIsInitializedBackgroundImage(true);
    }
    init();
  }, []);

  return {
    backgroundImage,
    onLoadBackground,
    onUploadBackground,
    onDeleteBackground,
  };
}