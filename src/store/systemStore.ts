import { create } from "zustand";
import {
  DEFAULT_SEARCH_ENGINE_ID,
  type CustomSearchEngine,
} from "@/type/db";

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

  /* 当前搜索引擎标识 */
  selectedSearchEngineId: string;
  /* 自定义搜索引擎 */
  customSearchEngines: CustomSearchEngine[];
  isInitializedSearchEngine: boolean;
  changeIsInitializedSearchEngine: (isInitializedSearchEngine: boolean) => void;
  changeSelectedSearchEngineId: (selectedSearchEngineId: string) => void;
  changeCustomSearchEngines: (
    customSearchEngines: CustomSearchEngine[]
  ) => void;
};
// 系统级共享状态
const useSystemStore = create<SystemStore>((set) => ({
  /* 是否初始化数据库 */
  isInitializedDB: false,
  /* 是否被初始化背景图片 */
  isInitializedBackgroundImage: false,
  /* 背景图片 */
  backgroundImage: "",
  backgroundImageId: "",
  // 更新数据库初始化状态
  changeIsInitializedDB: (isInitializedDB: boolean) => set({ isInitializedDB }),
  // 更新背景图片初始化状态
  changeIsInitializedBackgroundImage: (isInitializedBackgroundImage: boolean) =>
    set({ isInitializedBackgroundImage }),
  // 更新背景图片地址
  changeBackgroundImage: (backgroundImage: string) => set({ backgroundImage }),
  // 更新背景图片标识
  changeBackgroundImageId: (backgroundImageId: string) =>
    set({ backgroundImageId }),
  // 当前搜索引擎标识
  selectedSearchEngineId: DEFAULT_SEARCH_ENGINE_ID,
  // 自定义搜索引擎列表
  customSearchEngines: [],
  // 搜索设置初始化状态
  isInitializedSearchEngine: false,
  // 更新搜索设置初始化状态
  changeIsInitializedSearchEngine: (isInitializedSearchEngine: boolean) =>
    set({ isInitializedSearchEngine }),
  // 更新当前搜索引擎标识
  changeSelectedSearchEngineId: (selectedSearchEngineId: string) =>
    set({ selectedSearchEngineId }),
  // 更新自定义搜索引擎列表
  changeCustomSearchEngines: (customSearchEngines: CustomSearchEngine[]) =>
    set({ customSearchEngines }),
}));

// 导出 Store Hook
export default useSystemStore;
