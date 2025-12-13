import useSystemStore from "../store/systemStore";
import { systemService } from "../services/index";
import { SearchEngineType } from "../type/db";
import { useCallback, useEffect } from "react";

export function useSearchEngine() {
  const searchEngine = useSystemStore((state) => state.searchEngine);
  const isInitializedDB = useSystemStore((state) => state.isInitializedDB);
  const isInitializedSearchEngine = useSystemStore(
    (state) => state.isInitializedSearchEngine
  );
  const changeSearchEngine = useSystemStore(
    (state) => state.changeSearchEngine
  );
  const changeIsInitializedSearchEngine = useSystemStore(
    (state) => state.changeIsInitializedSearchEngine
  );

  /* 切换搜索引擎 */
  const onChangeSearchEngine = useCallback(
    (engine: keyof typeof SearchEngineType) => {
      changeSearchEngine(engine);
      systemService.updateSearchEngine(engine);
    },
    [changeSearchEngine]
  );

  useEffect(() => {
    const init = async () => {
      const searchEngine = await systemService.getSearchEngine();
      if (searchEngine) {
        changeSearchEngine(
          searchEngine as unknown as keyof typeof SearchEngineType
        );
      }
      changeIsInitializedSearchEngine(true);
    };

    if (isInitializedDB) {
      init();
    }
  }, [isInitializedDB]);

  return {
    searchEngine,
    isInitializedSearchEngine,
    onChangeSearchEngine,
  };
}
