import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import BaiduImg from "../../../assets/baidu.png";
import BingImg from "../../../assets/bing.png";
import DuckDuckGoImg from "../../../assets/duckduckgo.png";
import GoogleImg from "../../../assets/google.png";
import { SearchEngineType } from "@/type/db";
import { useSearchEngine } from "@/hooks/useSearchEngine";

export interface SearchEngine {
  id: (typeof SearchEngineType)[keyof typeof SearchEngineType];
  name: string;
  url: string;
  icon?: string;
}

const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  {
    id: SearchEngineType.GOOGLE,
    name: "Google",
    url: "https://www.google.com/search?q=",
    icon: GoogleImg,
  },
  {
    id: SearchEngineType.BING,
    name: "Bing",
    url: "https://www.bing.com/search?q=",
    icon: BingImg,
  },
  {
    id: SearchEngineType.BAIDU,
    name: "百度",
    url: "https://www.baidu.com/s?wd=",
    icon: BaiduImg,
  },
  {
    id: SearchEngineType.DUCKDUCKGO,
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=",
    icon: DuckDuckGoImg,
  },
];

export interface SearchInputProps {
  className?: string;
  placeholder?: string;
  searchEngines?: SearchEngine[];
}

export default function SearchInput({
  className,
  placeholder = "搜索或输入网址...",
  searchEngines = DEFAULT_SEARCH_ENGINES,
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const { searchEngine, isInitializedSearchEngine, onChangeSearchEngine } =
    useSearchEngine();

  const selectedEngine = useMemo(() => {
    if (!isInitializedSearchEngine) {
      return {
        id: "",
        name: "",
        url: "",
        icon: "",
      };
    }
    return searchEngines.find((e) => e.id === searchEngine)!;
  }, [searchEngines, searchEngine, isInitializedSearchEngine]);

  // 处理输入变化
  const onQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  // 处理搜索引擎切换
  const onEngineChange = useCallback(
    (engine: SearchEngine) => {
      onChangeSearchEngine(engine.id);
    },
    [onChangeSearchEngine]
  );

  // 处理回车搜索
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && query.trim()) {
        // 检查是否是 URL 或域名
        const urlPattern = /^(https?:\/\/|www\.)/i;
        const domainPattern =
          /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;

        let targetUrl = "";
        if (urlPattern.test(query)) {
          targetUrl = query.startsWith("http") ? query : "https://" + query;
        } else if (domainPattern.test(query)) {
          targetUrl = "https://" + query;
        } else {
          // 使用选中的搜索引擎进行搜索
          targetUrl = selectedEngine.url + encodeURIComponent(query);
        }

        // 在新窗口打开
        window.open(targetUrl, "_blank");
      }
    },
    [query, selectedEngine]
  );

  return (
    <div
      className={cn(
        "flex items-center w-full max-w-[600px] bg-white/15 backdrop-blur-md rounded-md overflow-hidden transition-all duration-300 focus-within:bg-white/25 focus-within:shadow-xl focus-within:shadow-black/20",
        className
      )}
    >
      {/* 搜索引擎选择器 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center px-3 py-2 h-12 w-12 bg-transparent text-white border-none outline-none transition-all duration-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0 cursor-pointer">
            {(() => {
              if (!selectedEngine.icon) {
                return null;
              }
              return (
                <img
                  src={selectedEngine.icon}
                  alt={selectedEngine.name}
                  className="w-4 h-4 shrink-0"
                />
              );
            })()}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-white/15 backdrop-blur-xl text-white p-2 min-w-[180px] border border-white/20"
          sideOffset={8}
          arrowClassName="bg-transparent fill-transparent"
        >
          <div className="flex flex-col gap-1">
            {searchEngines.map((engine) => {
              return (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => onEngineChange(engine)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-left cursor-pointer",
                    "hover:bg-white/20 active:bg-white/30",
                    selectedEngine.id === engine.id
                      ? "bg-white/25 text-white font-semibold"
                      : "text-white/80 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={engine.icon}
                      alt={engine.name}
                      className="w-4 h-4 shrink-0"
                    />
                    <span>{engine.name}</span>
                    {selectedEngine.id === engine.id && (
                      <span className="ml-auto text-white">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </TooltipContent>
      </Tooltip>

      {/* 分隔线 */}
      <div className="h-6 w-px bg-white/20" />

      {/* 搜索输入框 */}
      <Input
        type="text"
        className="flex-1 h-12 text-xl border-none bg-transparent text-white placeholder-white/70 outline-none transition-all duration-300 focus:bg-transparent focus:ring-0 focus-visible:ring-0"
        placeholder={placeholder}
        onChange={onQueryChange}
        onKeyDown={onKeyDown}
        autoFocus
      />
    </div>
  );
}
