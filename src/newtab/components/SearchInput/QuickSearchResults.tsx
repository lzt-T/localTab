import { ArrowUpRight, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  getQuickSearchOptionId,
  getResultHostname,
  QUICK_SEARCH_LIST_ID,
  WEB_SEARCH_OPTION_ID,
  type QuickSearchResult,
} from "@/newtab/components/SearchInput/quick-search";

interface QuickSearchResultsProps {
  results: QuickSearchResult[];
  activeOptionIndex: number;
  query: string;
  searchEngineName: string;
  onActiveOptionChange: (index: number) => void;
  onOpenLink: (url: string) => void;
  onSearchWeb: () => void;
}

/** 渲染本地网址建议和网页搜索操作。 */
export default function QuickSearchResults({
  results,
  activeOptionIndex,
  query,
  searchEngineName,
  onActiveOptionChange,
  onOpenLink,
  onSearchWeb,
}: QuickSearchResultsProps) {
  // 国际化工具
  const { t } = useTranslation();

  return (
    <div
      id={QUICK_SEARCH_LIST_ID}
      role="listbox"
      aria-label={t("search.quickResults")}
      className="glass-style-overlay absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl p-2 text-white shadow-[0_18px_46px_rgba(0,0,0,0.36)]"
    >
      {results.map((result, index) => {
        // 当前结果展示的域名
        const hostname = getResultHostname(result.link.url);
        // 当前结果的分类和文件夹位置
        const location = [result.categoryName, result.groupName]
          .filter(Boolean)
          .join(" / ");
        // 当前结果是否被键盘高亮
        const isActive = activeOptionIndex === index;

        return (
          <button
            id={getQuickSearchOptionId(result)}
            key={result.link.id}
            type="button"
            role="option"
            tabIndex={-1}
            aria-selected={isActive}
            aria-label={t("search.quickResultLabel", {
              title: result.link.title,
              hostname,
              location,
            })}
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition-colors duration-150",
              isActive
                ? "bg-white/15 text-white"
                : "text-white/80 hover:bg-white/[0.08] hover:text-white"
            )}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => onActiveOptionChange(index)}
            onClick={() => onOpenLink(result.link.url)}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-blue-100/85">
              <ArrowUpRight className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {result.link.title}
              </span>
              <span className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-white/50">
                <span className="truncate">{hostname}</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{location}</span>
              </span>
            </span>
          </button>
        );
      })}

      {results.length > 0 ? (
        <div className="my-1 h-px bg-white/10" />
      ) : null}

      <button
        id={WEB_SEARCH_OPTION_ID}
        type="button"
        role="option"
        tabIndex={-1}
        aria-selected={activeOptionIndex === results.length}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-none transition-colors duration-150",
          activeOptionIndex === results.length
            ? "bg-white/15 text-white"
            : "text-white/65 hover:bg-white/[0.08] hover:text-white"
        )}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => onActiveOptionChange(results.length)}
        onClick={onSearchWeb}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-blue-100/85">
          <Search className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">
          {t("search.searchWithEngine", {
            engine: searchEngineName,
            query: query.trim(),
          })}
        </span>
        <span className="hidden shrink-0 text-xs font-semibold text-white/35 sm:block">
          ENTER
        </span>
      </button>
    </div>
  );
}
