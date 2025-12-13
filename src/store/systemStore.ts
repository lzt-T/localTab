import { create } from 'zustand'

type SystemStore = {
  /* 是否初始化数据库 */
  isInitializedDB: boolean;
  changeIsInitializedDB: (isInitializedDB: boolean) => void;
  /* 是否被初始化背景图片 */
  isInitializedBackgroundImage: boolean;
  changeIsInitializedBackgroundImage: (isInitializedBackgroundImage: boolean) => void;
  /* 背景图片 */
  backgroundImage: string;
  backgroundImageId: string;
  changeBackgroundImage: (backgroundImage: string) => void;
  changeBackgroundImageId: (backgroundImageId: string) => void;
}
const useSystemStore = create<SystemStore>((set) => ({
  /* 是否初始化数据库 */
  isInitializedDB: false,
  /* 是否被初始化背景图片 */
  isInitializedBackgroundImage: false,
  /* 背景图片 */
  backgroundImage: '',
  backgroundImageId: '',
  changeIsInitializedDB: (isInitializedDB: boolean) => set({ isInitializedDB }),
  changeIsInitializedBackgroundImage: (isInitializedBackgroundImage: boolean) => set({ isInitializedBackgroundImage }),
  changeBackgroundImage: (backgroundImage: string) => set({ backgroundImage }),
  changeBackgroundImageId: (backgroundImageId: string) => set({ backgroundImageId }),
}));

// 导出 Store Hook
export default useSystemStore;