import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  buildQuickSearchIndex,
  getQuickSearchOptionId,
  QUICK_SEARCH_LIST_ID,
  searchLocalLinksFromIndex,
  WEB_SEARCH_OPTION_ID,
} from "@/newtab/components/SearchInput/quick-search";

export interface SearchInputProps {
  className?: string;
  placeholder?: string;
  categories: CategoryInfo[];
  onOpenLink: (url: string) => void;
}

/** 判断事件目标当前是否处于可输入控件内，避免单键快捷键误触发。 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * 新标签页搜索输入框。
 */
function SearchInput({
  className,
  placeholder,
  categories,
  onOpenLink,
}: SearchInputProps) {
  // 国际化工具
  const { t } = useTranslation();
  // 搜索框元素引用，供全局快捷键聚焦
  const inputRef = useRef<HTMLInputElement>(null);
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

  // 缓存扁平小写搜索索引，避免切换高亮或弹窗时重复构建
  const searchIndex = useMemo(
    () => buildQuickSearchIndex(categories),
    [categories]
  );

  // 与当前输入匹配的本地网址
  const quickSearchResults = useMemo(
    () => searchLocalLinksFromIndex(searchIndex, query),
    [searchIndex, query]
  );

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

  // 支持按 `/` 或 `Ctrl/Cmd + K` 快速重新聚焦搜索框
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) {
        return;
      }

      const isCmdOrCtrlK =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k";
      const isSlashShortcut =
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isEditableTarget(event.target);

      if (!isCmdOrCtrlK && !isSlashShortcut) {
        return;
      }

      // 存在打开的模态弹窗时不抢占焦点
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  /**
   * 更新搜索内容。
   */
  const onQueryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      setActiveOptionIndex(0);
    },
    []
  );

  /** 清空快速搜索输入并复位高亮项。 */
  const resetQuickSearch = useCallback(() => {
    setQuery("");
    setActiveOptionIndex(0);
  }, []);

  /** 回车打开本地网址并重置快速搜索。 */
  const openLocalLink = useCallback(
    (url: string) => {
      onOpenLink(url);
      resetQuickSearch();
    },
    [onOpenLink, resetQuickSearch]
  );

  /** 执行网页搜索并重置快速搜索。 */
  const searchWeb = useCallback(() => {
    onSearch(query);
    resetQuickSearch();
  }, [onSearch, query, resetQuickSearch]);

  /** 处理快速搜索的键盘导航和执行操作。 */
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key === "Escape" && hasQuery) {
      event.preventDefault();
      resetQuickSearch();
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
        <div className="glass-style-floating flex w-full items-center overflow-hidden rounded-xl transition-[background-color,border-color,box-shadow] duration-200 focus-within:border-[var(--surface-border-strong)] focus-within:bg-[var(--glass-floating-focus-bg)]">
          <Popover open={isSearchMenuOpen} onOpenChange={setIsSearchMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 bg-transparent px-2 py-2 text-[var(--surface-text-secondary)] outline-none transition-colors duration-200 hover:bg-[var(--surface-hover)] hover:text-[var(--surface-text)] focus-visible:ring-2 focus-visible:ring-[var(--surface-ring)] sm:min-w-32 sm:justify-start"
                title={selectedSearchEngineName}
                aria-label={selectedSearchEngineName}
                disabled={!isInitializedSearchEngine}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[var(--surface-text-secondary)]">
                  <Search className="size-4" />
                </span>
                <span className="hidden min-w-0 flex-1 truncate text-left text-xs font-medium sm:block">
                  {selectedSearchEngineName}
                </span>
                <ChevronDown className="hidden size-3.5 shrink-0 text-[var(--surface-text-muted)] sm:block" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              sideOffset={8}
              className="glass-style-popover w-64 p-2"
            >
              <div className="flex flex-col gap-1">
              {isDefaultSearchSupported ? (
                <button
                  type="button"
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-hover-strong)]",
                    selectedSearchEngineId === DEFAULT_SEARCH_ENGINE_ID
                      ? "bg-[var(--surface-hover-strong)] font-semibold text-[var(--surface-text)]"
                      : "text-[var(--surface-text-secondary)]"
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
                <div className="my-1 h-px bg-[var(--surface-divider)]" />
              ) : null}

              {!isDefaultSearchSupported &&
              customSearchEngines.length === 0 ? (
                <p className="px-3 py-2 text-xs leading-relaxed text-[var(--surface-text-muted)]">
                  {t("search.defaultUnsupported")}
                </p>
              ) : null}

              {customSearchEngines.map((searchEngine) => (
                <div
                  key={searchEngine.id}
                  className={cn(
                    "group flex items-center rounded-lg transition-colors hover:bg-[var(--surface-hover-strong)]",
                    selectedSearchEngineId === searchEngine.id
                      ? "bg-[var(--surface-hover-strong)]"
                      : ""
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--surface-text-secondary)] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--surface-ring)]"
                    onClick={() => onSelectSearchEngine(searchEngine.id)}
                  >
                    <Search className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      {searchEngine.name}
                    </span>
                    {selectedSearchEngineId === searchEngine.id ? (
                      <Check className="size-4 shrink-0 text-[var(--surface-text)]" />
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className="mr-1 cursor-pointer rounded-md p-1.5 text-[var(--surface-text-subtle)] opacity-0 outline-none transition-all hover:bg-[var(--surface-hover)] hover:text-red-400 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--surface-ring)] group-hover:opacity-100"
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

              <div className="my-1 h-px bg-[var(--surface-divider)]" />
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--surface-text-secondary)] transition-colors hover:bg-[var(--surface-hover-strong)] hover:text-[var(--surface-text)]"
                onClick={onAddSearchEngineClick}
              >
                <Plus className="size-4" />
                <span>{t("search.addEngine")}</span>
              </button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="h-5 w-px bg-[var(--surface-divider)]" />

          <Input
            ref={inputRef}
            type="text"
            value={query}
            role="combobox"
            className="h-11 min-w-0 flex-1 rounded-none border-none bg-transparent px-4 text-sm font-medium text-[var(--surface-text)] shadow-none placeholder:text-[var(--surface-text-subtle)] outline-none focus:bg-transparent focus:ring-0 focus-visible:ring-0"
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
          <kbd className="mr-3 hidden rounded-md border border-[var(--surface-border)] bg-[var(--kbd-bg)] px-2 py-1 text-xs font-semibold text-[var(--surface-text-subtle)] sm:block">
            {isQuickSearchOpen
              ? "↑↓ ENTER"
              : isInputFocused || hasQuery
              ? "ENTER"
              : "/"}
          </kbd>
        </div>

        {isQuickSearchOpen ? (
          <QuickSearchResults
            results={quickSearchResults}
            activeOptionIndex={validActiveOptionIndex}
            query={query}
            searchEngineName={selectedSearchEngineName}
            onActiveOptionChange={setActiveOptionIndex}
            onSelectLocalLink={resetQuickSearch}
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

export default memo(SearchInput);
