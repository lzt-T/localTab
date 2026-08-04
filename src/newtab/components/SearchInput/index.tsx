import { useState } from "react";
import { Check, ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DEFAULT_SEARCH_ENGINE_ID, type CategoryInfo } from "@/type/db";
import { useSearchEngine } from "@/hooks/useSearchEngine";
import AddSearchEngineDialog from "@/newtab/components/SearchInput/AddSearchEngineDialog";
import QuickSearchResults from "@/newtab/components/SearchInput/QuickSearchResults";
import {
  getQuickSearchOptionId,
  QUICK_SEARCH_LIST_ID,
  searchLocalLinks,
  WEB_SEARCH_OPTION_ID,
} from "@/newtab/components/SearchInput/quick-search";

export interface SearchInputProps {
  className?: string;
  placeholder?: string;
  categories: CategoryInfo[];
  onOpenLink: (url: string) => void;
}

/**
 * 新标签页搜索输入框。
 */
export default function SearchInput({
  className,
  placeholder,
  categories,
  onOpenLink,
}: SearchInputProps) {
  // 国际化工具
  const { t } = useTranslation();
  // 当前搜索内容
  const [query, setQuery] = useState("");
  // 当前高亮的快速搜索选项索引
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);
  // 搜索输入框聚焦状态
  const [isInputFocused, setIsInputFocused] = useState(false);
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
  // 当前输入是否包含可搜索内容
  const hasQuery = query.trim().length > 0;
  // 快速搜索结果面板是否可见
  const isQuickSearchOpen = hasQuery && isInputFocused;
  // 与当前输入匹配的本地网址
  const quickSearchResults = searchLocalLinks(categories, query);
  // 本地结果与网页搜索操作的总数量
  const optionCount = quickSearchResults.length + 1;
  // 防止分类更新后高亮索引超出结果范围
  const validActiveOptionIndex = Math.min(
    activeOptionIndex,
    optionCount - 1
  );
  // 当前高亮选项的无障碍标识
  const activeOptionId =
    validActiveOptionIndex < quickSearchResults.length
      ? getQuickSearchOptionId(quickSearchResults[validActiveOptionIndex])
      : WEB_SEARCH_OPTION_ID;

  /**
   * 更新搜索内容。
   */
  const onQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setActiveOptionIndex(0);
  };

  /** 打开本地网址并重置快速搜索。 */
  const openLocalLink = (url: string) => {
    onOpenLink(url);
    setQuery("");
    setActiveOptionIndex(0);
  };

  /** 执行网页搜索并重置快速搜索。 */
  const searchWeb = () => {
    onSearch(query);
    setQuery("");
    setActiveOptionIndex(0);
  };

  /** 处理快速搜索的键盘导航和执行操作。 */
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key === "Escape" && hasQuery) {
      event.preventDefault();
      setQuery("");
      setActiveOptionIndex(0);
      return;
    }

    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && hasQuery) {
      event.preventDefault();
      // 键盘方向对应的索引变化量
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveOptionIndex(
        (validActiveOptionIndex + direction + optionCount) % optionCount
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      // 当前高亮的本地网址
      const activeResult = quickSearchResults[validActiveOptionIndex];
      if (hasQuery && activeResult) {
        openLocalLink(activeResult.link.url);
        return;
      }

      searchWeb();
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
        className={cn("relative w-full max-w-[680px]", className)}
      >
        <div className="glass-style-border flex w-full items-center overflow-hidden rounded-xl bg-[rgba(38,40,44,0.52)] shadow-[0_16px_44px_rgba(0,0,0,0.22)] transition-[background-color,border-color,box-shadow] duration-200 focus-within:border-white/25 focus-within:bg-[rgba(46,48,52,0.66)] focus-within:shadow-[0_20px_52px_rgba(0,0,0,0.28)]">
          <Popover open={isSearchMenuOpen} onOpenChange={setIsSearchMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 bg-transparent px-2.5 py-2 text-white/65 outline-none transition-colors duration-200 hover:bg-white/[0.07] hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 sm:min-w-36 sm:justify-start"
                title={selectedSearchEngineName}
                aria-label={selectedSearchEngineName}
                disabled={!isInitializedSearchEngine}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-blue-100/85">
                  <Search className="size-4" />
                </span>
                <span className="hidden min-w-0 flex-1 truncate text-left text-xs font-medium sm:block">
                  {selectedSearchEngineName}
                </span>
                <ChevronDown className="hidden size-3.5 shrink-0 text-slate-500 sm:block" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              sideOffset={8}
              className="glass-style-overlay w-64 p-2 text-white shadow-xl shadow-black/30"
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

          <div className="h-5 w-px bg-white/12" />

          <Input
            type="text"
            value={query}
            role="combobox"
            className="h-11 min-w-0 flex-1 border-none bg-transparent px-4 text-sm font-medium text-white placeholder:text-white/45 outline-none focus:bg-transparent focus:ring-0 focus-visible:ring-0"
            placeholder={placeholder ?? t("search.placeholder")}
            aria-label={placeholder ?? t("search.placeholder")}
            aria-autocomplete="list"
            aria-controls={
              isQuickSearchOpen ? QUICK_SEARCH_LIST_ID : undefined
            }
            aria-expanded={isQuickSearchOpen}
            aria-activedescendant={
              isQuickSearchOpen ? activeOptionId : undefined
            }
            onChange={onQueryChange}
            onKeyDown={onKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            autoFocus
          />
          <kbd className="mr-3 hidden rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-white/40 sm:block">
            ↑↓ ENTER
          </kbd>
        </div>

        {isQuickSearchOpen ? (
          <QuickSearchResults
            results={quickSearchResults}
            activeOptionIndex={validActiveOptionIndex}
            query={query}
            searchEngineName={selectedSearchEngineName}
            onActiveOptionChange={setActiveOptionIndex}
            onOpenLink={openLocalLink}
            onSearchWeb={searchWeb}
          />
        ) : null}
      </div>

      <AddSearchEngineDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={onAddSearchEngine}
      />
    </>
  );
}
