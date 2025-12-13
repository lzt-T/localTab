import { create } from "zustand";
import { SearchEngineType } from "@/type/db";

type SystemStore = {
  /* 是否初始化数据库 */
  isInitializedDB: boolean;
  changeIsInitializedDB: (isInitializedDB: boolean) => void;
  /* 是否被初始化背景图片 */
  isInitializedBackgroundImage: boolean;
  changeIsInitializedBackgroundImage: (
    isInitializedBackgroundImage: boolean
  ) => void;
  /* 背景图片 */
  backgroundImage: string;
  backgroundImageId: string;
  changeBackgroundImage: (backgroundImage: string) => void;
  changeBackgroundImageId: (backgroundImageId: string) => void;

  /* 搜索引擎类型 */
  searchEngine: keyof typeof SearchEngineType | undefined;
  isInitializedSearchEngine: boolean;
  changeIsInitializedSearchEngine: (isInitializedSearchEngine: boolean) => void;
  changeSearchEngine: (searchEngine: keyof typeof SearchEngineType) => void;
};
const useSystemStore = create<SystemStore>((set) => ({
  /* 是否初始化数据库 */
  isInitializedDB: false,
  /* 是否被初始化背景图片 */
  isInitializedBackgroundImage: false,
  /* 背景图片 */
  backgroundImage: "",
  backgroundImageId: "",
  changeIsInitializedDB: (isInitializedDB: boolean) => set({ isInitializedDB }),
  changeIsInitializedBackgroundImage: (isInitializedBackgroundImage: boolean) =>
    set({ isInitializedBackgroundImage }),
  changeBackgroundImage: (backgroundImage: string) => set({ backgroundImage }),
  changeBackgroundImageId: (backgroundImageId: string) =>
    set({ backgroundImageId }),
  searchEngine: undefined,
  isInitializedSearchEngine: false,
  changeIsInitializedSearchEngine: (isInitializedSearchEngine: boolean) =>
    set({ isInitializedSearchEngine }),
  changeSearchEngine: (searchEngine: keyof typeof SearchEngineType) =>
    set({ searchEngine }),
}));

// 导出 Store Hook
export default useSystemStore;
