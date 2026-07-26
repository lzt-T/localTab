import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import Icon from "@/newtab/components/Icon";

type LinkItemVariant = "default" | "drag-placeholder" | "drag-preview";

// 不同展示模式对应的网址卡片视觉样式
const LINK_ITEM_CLASS_BY_VARIANT: Record<LinkItemVariant, string> = {
  default:
    "glass-style-border shadow-md shadow-black/10 transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[rgba(68,70,74,0.62)] hover:shadow-lg hover:shadow-black/20 has-[[data-state=open]]:-translate-y-0.5 has-[[data-state=open]]:ring-2 has-[[data-state=open]]:ring-blue-200/45",
  "drag-placeholder": "glass-style-border shadow-md shadow-black/10",
  "drag-preview":
    "border border-white/20 bg-[rgba(58,60,64,0.94)] shadow-lg shadow-black/30",
};

interface LinkItemProps {
  link: {
    id?: string;
    url: string;
    icon: string;
    title: string;
    description: string;
  };
  handleEditClick?: (linkId: string) => void;
  handleSkipClick?: (url: string) => void;
  variant?: LinkItemVariant;
}

/** 提取网址卡片需要展示的主机名。 */
function getLinkHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** 渲染可访问和编辑的网址卡片。 */
export default function Index({
  link,
  handleEditClick,
  handleSkipClick,
  variant = "default",
}: LinkItemProps) {
  // 卡片操作菜单的本地化文案
  const { t } = useTranslation();

  // 外部图标加载失败时记录对应地址
  const [failedExternalIconUrl, setFailedExternalIconUrl] = useState("");

  // 当前链接是否使用网络图标
  const isExternalIcon = link.icon.startsWith("http");

  // 网络图标可用时优先展示原始图标
  const shouldShowExternalIcon =
    isExternalIcon && failedExternalIconUrl !== link.icon;
  // 当前网址是否包含可展示的详情
  const hasDescription = link.description.trim().length > 0;
  // 卡片无障碍名称使用的站点域名
  const linkHostname = getLinkHostname(link.url);

  /** 打开当前网址的编辑弹窗。 */
  const onEditClick = useCallback(
    () => {
      if (link.id && handleEditClick) {
        handleEditClick(link.id);
      }
    },
    [link.id, handleEditClick]
  );

  /** 在新标签页打开当前网址。 */
  const onSkipClick = useCallback(() => {
    if (link.url && handleSkipClick) {
      handleSkipClick(link.url);
    }
  }, [link.url, handleSkipClick]);

  /** 标记加载失败的网络图标并回退到默认图标。 */
  const onExternalIconError = () => {
    setFailedExternalIconUrl(link.icon);
  };

  return (
    <div
      className={cn(
        "group/item relative flex h-24 rounded-xl",
        LINK_ITEM_CLASS_BY_VARIANT[variant]
      )}
    >
      {link.id && handleEditClick && (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 flex size-7 cursor-pointer items-center justify-center rounded-md text-white/65 opacity-0 outline-none transition-[background-color,color,opacity] hover:bg-white/15 hover:text-white focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/60 group-hover/item:opacity-100 group-focus-within/item:opacity-100"
          onClick={onEditClick}
          title={t("common.edit")}
          aria-label={t("common.edit")}
        >
          <Edit size={15} />
        </button>
      )}
      <button
        type="button"
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl px-3 py-2.5 text-center outline-none focus-visible:ring-2 focus-visible:ring-blue-200/75"
        onClick={onSkipClick}
        aria-label={`${link.title}, ${linkHostname}`}
      >
        <span className="mb-1 flex h-7 shrink-0 items-center justify-center">
          {shouldShowExternalIcon ? (
            <img
              src={link.icon}
              alt=""
              className="size-6 rounded object-contain"
              onError={onExternalIconError}
            />
          ) : (
            <Icon
              name={isExternalIcon ? "link" : link.icon || "link"}
              size={24}
              className="text-blue-100/90"
            />
          )}
        </span>
        <span className="w-full min-w-0">
          <span
            className={cn(
              "block text-sm font-medium leading-5 text-white/90",
              hasDescription ? "truncate" : "line-clamp-2"
            )}
            title={link.title}
          >
            {link.title}
          </span>
          {hasDescription && (
            <span
              className="block truncate text-xs leading-4 text-white/50"
              title={link.description}
            >
              {link.description}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
