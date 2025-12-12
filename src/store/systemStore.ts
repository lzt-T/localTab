import { create } from 'zustand'

type SystemStore = {
  /* 是否初始化数据库 */
  isInitializedDB: boolean;
  changeIsInitializedDB: (isInitializedDB: boolean) => void;
  /* 是否被初始化背景图片 */
  isInitializedBackgroundImage: boolean;
  changeIsInitializedBackgroundImage: (isInitializedBackgroundImage: boolean) => void;
}
const useSystemStore = create<SystemStore>((set) => ({
  /* 是否初始化数据库 */
  isInitializedDB: false,
  /* 是否被初始化背景图片 */
  isInitializedBackgroundImage: false,

  changeIsInitializedDB: (isInitializedDB: boolean) => set({ isInitializedDB }),
  changeIsInitializedBackgroundImage: (isInitializedBackgroundImage: boolean) => set({ isInitializedBackgroundImage }),
}));

// 导出 Store Hook
export default useSystemStore;