import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { browserSearchService } from "@/services/browserSearchService";
import { systemService } from "@/services/systemService";
import useSystemStore from "@/store/systemStore";
import {
  DEFAULT_SEARCH_ENGINE_ID,
  type CustomSearchEngine,
} from "@/type/db";
import { getUniqueId } from "@/utils/base";

// 完整 URL 前缀
const URL_PATTERN = /^(https?:\/\/|www\.)/i;
// 简单域名格式
const DOMAIN_PATTERN =
  /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;

/**
 * 管理搜索引擎设置和搜索流程。
 */
export function useSearchEngine() {
  // 国际化工具
  const { t } = useTranslation();
  // 当前搜索引擎标识
  const selectedSearchEngineId = useSystemStore(
    (state) => state.selectedSearchEngineId
  );
  // 自定义搜索引擎列表
  const customSearchEngines = useSystemStore(
    (state) => state.customSearchEngines
  );
  // 数据库初始化状态
  const isInitializedDB = useSystemStore((state) => state.isInitializedDB);
  // 搜索设置初始化状态
  const isInitializedSearchEngine = useSystemStore(
    (state) => state.isInitializedSearchEngine
  );
  // 当前搜索引擎更新器
  const changeSelectedSearchEngineId = useSystemStore(
    (state) => state.changeSelectedSearchEngineId
  );
  // 自定义搜索引擎更新器
  const changeCustomSearchEngines = useSystemStore(
    (state) => state.changeCustomSearchEngines
  );
  // 搜索设置初始化状态更新器
  const changeIsInitializedSearchEngine = useSystemStore(
    (state) => state.changeIsInitializedSearchEngine
  );
  // 浏览器默认搜索支持状态
  const isDefaultSearchSupported =
    browserSearchService.isDefaultSearchSupported();

  /**
   * 选择搜索引擎。
   */
  const onChangeSearchEngine = useCallback(
    (searchEngineId: string) => {
      changeSelectedSearchEngineId(searchEngineId);
      void systemService.updateSelectedSearchEngineId(searchEngineId);
    },
    [changeSelectedSearchEngineId]
  );

  /**
   * 添加并选中自定义搜索引擎。
   */
  const onAddSearchEngine = useCallback(
    async (name: string, searchUrl: string) => {
      // 新增的自定义搜索引擎
      const customSearchEngine: CustomSearchEngine = {
        id: getUniqueId(),
        name: name.trim(),
        searchUrl: searchUrl.trim(),
      };
      // 添加后的搜索引擎列表
      const nextCustomSearchEngines = [
        ...customSearchEngines,
        customSearchEngine,
      ];

      changeCustomSearchEngines(nextCustomSearchEngines);
      changeSelectedSearchEngineId(customSearchEngine.id);
      await Promise.all([
        systemService.updateCustomSearchEngines(nextCustomSearchEngines),
        systemService.updateSelectedSearchEngineId(customSearchEngine.id),
      ]);
    },
    [
      customSearchEngines,
      changeCustomSearchEngines,
      changeSelectedSearchEngineId,
    ]
  );

  /**
   * 删除自定义搜索引擎。
   */
  const onDeleteSearchEngine = useCallback(
    async (searchEngineId: string) => {
      // 删除后的搜索引擎列表
      const nextCustomSearchEngines = customSearchEngines.filter(
        (searchEngine) => searchEngine.id !== searchEngineId
      );
      // 是否删除了当前选项
      const isDeletingSelectedEngine =
        selectedSearchEngineId === searchEngineId;
      // 删除当前选项后的回退标识
      const fallbackSearchEngineId = isDefaultSearchSupported
        ? DEFAULT_SEARCH_ENGINE_ID
        : nextCustomSearchEngines[0]?.id ?? DEFAULT_SEARCH_ENGINE_ID;

      changeCustomSearchEngines(nextCustomSearchEngines);
      if (isDeletingSelectedEngine) {
        changeSelectedSearchEngineId(fallbackSearchEngineId);
      }

      // 需要持久化的操作
      const persistenceTasks: Promise<void>[] = [
        systemService.updateCustomSearchEngines(nextCustomSearchEngines),
      ];
      if (isDeletingSelectedEngine) {
        persistenceTasks.push(
          systemService.updateSelectedSearchEngineId(fallbackSearchEngineId)
        );
      }
      await Promise.all(persistenceTasks);
    },
    [
      customSearchEngines,
      selectedSearchEngineId,
      changeCustomSearchEngines,
      changeSelectedSearchEngineId,
      isDefaultSearchSupported,
    ]
  );

  /**
   * 根据输入内容打开网址或执行搜索。
   */
  const onSearch = useCallback(
    (input: string) => {
      // 去除首尾空白后的输入
      const query = input.trim();
      if (!query) {
        return;
      }

      if (URL_PATTERN.test(query)) {
        // 带协议的目标地址
        const targetUrl = query.startsWith("http")
          ? query
          : `https://${query}`;
        window.open(targetUrl, "_blank");
        return;
      }

      if (DOMAIN_PATTERN.test(query)) {
        window.open(`https://${query}`, "_blank");
        return;
      }

      // 当前选中的自定义搜索引擎
      const customSearchEngine = customSearchEngines.find(
        (searchEngine) => searchEngine.id === selectedSearchEngineId
      );
      // 当前搜索策略类型
      const searchStrategyType = customSearchEngine
        ? "custom"
        : isDefaultSearchSupported
        ? "default"
        : "unsupported";
      // 按搜索引擎类型分发搜索行为
      const searchStrategyByType = {
        default: () => browserSearchService.searchWithDefault(query),
        custom: () => {
          if (customSearchEngine) {
            browserSearchService.searchWithCustomEngine(
              customSearchEngine.searchUrl,
              query
            );
          }
        },
        unsupported: () => toast.warning(t("search.defaultUnsupported")),
      };
      searchStrategyByType[searchStrategyType]();
    },
    [
      customSearchEngines,
      selectedSearchEngineId,
      isDefaultSearchSupported,
      t,
    ]
  );

  useEffect(() => {
    /**
     * 从数据库加载搜索设置。
     */
    const initializeSearchEngine = async () => {
      // 并行加载搜索设置
      const [storedSearchEngineId, storedCustomSearchEngines] =
        await Promise.all([
          systemService.getSelectedSearchEngineId(),
          systemService.getCustomSearchEngines(),
        ]);
      // 当前标识是否仍然有效
      const isSelectedEngineValid =
        (isDefaultSearchSupported &&
          storedSearchEngineId === DEFAULT_SEARCH_ENGINE_ID) ||
        storedCustomSearchEngines.some(
          (searchEngine) => searchEngine.id === storedSearchEngineId
        );
      // 校验后的搜索引擎标识
      const validSearchEngineId = isSelectedEngineValid
        ? storedSearchEngineId
        : storedCustomSearchEngines[0]?.id ?? DEFAULT_SEARCH_ENGINE_ID;

      changeCustomSearchEngines(storedCustomSearchEngines);
      changeSelectedSearchEngineId(validSearchEngineId);
      changeIsInitializedSearchEngine(true);

      if (!isSelectedEngineValid) {
        await systemService.updateSelectedSearchEngineId(validSearchEngineId);
      }
    };

    if (isInitializedDB) {
      void initializeSearchEngine();
    }
  }, [
    isInitializedDB,
    changeCustomSearchEngines,
    changeSelectedSearchEngineId,
    changeIsInitializedSearchEngine,
    isDefaultSearchSupported,
  ]);

  return {
    selectedSearchEngineId,
    customSearchEngines,
    isInitializedSearchEngine,
    isDefaultSearchSupported,
    onChangeSearchEngine,
    onAddSearchEngine,
    onDeleteSearchEngine,
    onSearch,
  };
}
