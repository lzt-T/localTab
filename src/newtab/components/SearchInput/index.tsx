import { useState } from "react";
import { Check, Plus, Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DEFAULT_SEARCH_ENGINE_ID } from "@/type/db";
import { useSearchEngine } from "@/hooks/useSearchEngine";
import AddSearchEngineDialog from "@/newtab/components/SearchInput/AddSearchEngineDialog";

export interface SearchInputProps {
  className?: string;
  placeholder?: string;
}

/**
 * 新标签页搜索输入框。
 */
export default function SearchInput({
  className,
  placeholder,
}: SearchInputProps) {
  // 国际化工具
  const { t } = useTranslation();
  // 当前搜索内容
  const [query, setQuery] = useState("");
  // 搜索引擎菜单状态
  const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
  // 添加搜索引擎弹窗状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // 搜索引擎状态和操作
  const {
    selectedSearchEngineId,
    customSearchEngines,
    isInitializedSearchEngine,
    isDefaultSearchSupported,
    onChangeSearchEngine,
    onAddSearchEngine,
    onDeleteSearchEngine,
    onSearch,
  } = useSearchEngine();
  // 当前选中的自定义搜索引擎
  const selectedCustomSearchEngine = customSearchEngines.find(
    (searchEngine) => searchEngine.id === selectedSearchEngineId
  );
  // 当前搜索引擎显示名称
  const selectedSearchEngineName =
    selectedCustomSearchEngine?.name ??
    t(
      isDefaultSearchSupported
        ? "search.browserDefault"
        : "search.addEngine"
    );

  /**
   * 更新搜索内容。
   */
  const onQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  /**
   * 按回车执行搜索。
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onSearch(query);
    }
  };

  /**
   * 选择搜索引擎并关闭菜单。
   */
  const onSelectSearchEngine = (searchEngineId: string) => {
    onChangeSearchEngine(searchEngineId);
    setIsSearchMenuOpen(false);
  };

  /**
   * 打开添加搜索引擎弹窗。
   */
  const onAddSearchEngineClick = () => {
    setIsSearchMenuOpen(false);
    setIsAddDialogOpen(true);
  };

  /**
   * 删除指定自定义搜索引擎。
   */
  const onDeleteSearchEngineClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    searchEngineId: string
  ) => {
    event.stopPropagation();
    void onDeleteSearchEngine(searchEngineId);
  };

  return (
    <>
      <div
        className={cn(
          "glass-style-border flex w-full max-w-[640px] items-center overflow-hidden rounded-2xl shadow-lg shadow-black/15 transition-[background-color,border-color,box-shadow] duration-200 focus-within:border-white/25 focus-within:bg-[rgba(62,64,68,0.68)] focus-within:shadow-xl focus-within:shadow-black/25",
          className
        )}
      >
        <Popover open={isSearchMenuOpen} onOpenChange={setIsSearchMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-12 w-12 cursor-pointer items-center justify-center bg-transparent px-3 py-2 text-white outline-none transition-all duration-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50"
              title={selectedSearchEngineName}
              aria-label={selectedSearchEngineName}
              disabled={!isInitializedSearchEngine}
            >
              <Search className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={8}
            className="glass-style-border w-64 border-white/15 bg-[rgba(32,34,38,0.96)] p-2 text-white shadow-xl shadow-black/30 backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-1">
              {isDefaultSearchSupported ? (
                <button
                  type="button"
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/15",
                    selectedSearchEngineId === DEFAULT_SEARCH_ENGINE_ID
                      ? "bg-white/15 font-semibold text-white"
                      : "text-white/80"
                  )}
                  onClick={() =>
                    onSelectSearchEngine(DEFAULT_SEARCH_ENGINE_ID)
                  }
                >
                  <Search className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    {t("search.browserDefault")}
                  </span>
                  {selectedSearchEngineId === DEFAULT_SEARCH_ENGINE_ID ? (
                    <Check className="size-4 shrink-0" />
                  ) : null}
                </button>
              ) : null}

              {isDefaultSearchSupported &&
              customSearchEngines.length > 0 ? (
                <div className="my-1 h-px bg-white/10" />
              ) : null}

              {!isDefaultSearchSupported &&
              customSearchEngines.length === 0 ? (
                <p className="px-3 py-2 text-xs leading-relaxed text-white/55">
                  {t("search.defaultUnsupported")}
                </p>
              ) : null}

              {customSearchEngines.map((searchEngine) => (
                <div
                  key={searchEngine.id}
                  className={cn(
                    "group flex items-center rounded-lg transition-colors hover:bg-white/15",
                    selectedSearchEngineId === searchEngine.id
                      ? "bg-white/15"
                      : ""
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/50"
                    onClick={() => onSelectSearchEngine(searchEngine.id)}
                  >
                    <Search className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      {searchEngine.name}
                    </span>
                    {selectedSearchEngineId === searchEngine.id ? (
                      <Check className="size-4 shrink-0 text-white" />
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className="mr-1 cursor-pointer rounded-md p-1.5 text-white/40 opacity-0 outline-none transition-all hover:bg-white/10 hover:text-red-300 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/50 group-hover:opacity-100"
                    title={t("search.deleteEngine")}
                    aria-label={t("search.deleteEngine")}
                    onClick={(event) =>
                      onDeleteSearchEngineClick(event, searchEngine.id)
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}

              <div className="my-1 h-px bg-white/10" />
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                onClick={onAddSearchEngineClick}
              >
                <Plus className="size-4" />
                <span>{t("search.addEngine")}</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-white/20" />

        <Input
          type="text"
          value={query}
          className="h-12 flex-1 border-none bg-transparent text-base text-white placeholder-white/55 outline-none transition-all duration-300 focus:bg-transparent focus:ring-0 focus-visible:ring-0"
          placeholder={placeholder ?? t("search.placeholder")}
          aria-label={placeholder ?? t("search.placeholder")}
          onChange={onQueryChange}
          onKeyDown={onKeyDown}
          autoFocus
        />
      </div>

      <AddSearchEngineDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={onAddSearchEngine}
      />
    </>
  );
}
