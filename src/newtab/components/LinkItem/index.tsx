import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import Icon from "@/newtab/components/Icon";
import LinkMonogram, {
  shouldUseLinkMonogram,
} from "@/newtab/components/LinkMonogram";
import { isImageIcon } from "@/utils/icon";

type LinkItemVariant = "default" | "drag-placeholder" | "drag-preview";

// 不同展示模式对应的网址图标格前景样式
const LINK_ITEM_CLASS_BY_VARIANT: Record<LinkItemVariant, string> = {
  default:
    "rounded-2xl transition-[background-color,box-shadow] duration-200 group-hover/item:bg-[var(--tile-hover-bg)] has-[[data-state=open]]:ring-2 has-[[data-state=open]]:ring-[var(--surface-ring)]",
  "drag-placeholder": "",
  "drag-preview": "",
};

// 主图标块与名称的统一布局样式
const LINK_TILE_CLASS_NAME =
  "flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl px-1.5 py-2 text-center no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--surface-ring)]";

interface LinkItemProps {
  link: {
    id?: string;
    url: string;
    icon: string;
    title: string;
    description: string;
  };
  handleEditClick?: (linkId: string) => void;
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
function Index({
  link,
  handleEditClick,
  variant = "default",
}: LinkItemProps) {
  // 卡片操作菜单的本地化文案
  const { t } = useTranslation();

  // 图片图标加载失败时记录对应值
  const [failedImageIcon, setFailedImageIcon] = useState("");

  // 当前链接是否使用图片图标
  const hasImageIcon = isImageIcon(link.icon);

  // 图片图标可用时优先展示原始图标
  const shouldShowImageIcon =
    hasImageIcon && failedImageIcon !== link.icon;
  // 当前图标是否回退为首字徽标
  const isMonogramIcon =
    !shouldShowImageIcon && shouldUseLinkMonogram(link.icon, failedImageIcon);
  // 当前网址是否包含可展示的详情
  const hasDescription = link.description.trim().length > 0;
  // 卡片无障碍名称使用的站点域名
  const linkHostname = getLinkHostname(link.url);

  /** 打开当前网址的编辑弹窗。 */
  const onEditClick = useCallback(() => {
    if (link.id && handleEditClick) {
      handleEditClick(link.id);
    }
  }, [link.id, handleEditClick]);

  /** 标记加载失败的图片图标并回退到默认图标。 */
  const onImageIconError = () => {
    setFailedImageIcon(link.icon);
  };

  // 卡片内部图标与标题内容
  const tileContent =
    variant === "drag-placeholder" ? (
      <>
        <span
          className="size-[60px] shrink-0 rounded-[18px] border border-dashed border-[var(--surface-border-strong)] bg-[var(--surface-hover)] backdrop-blur-md"
          aria-hidden="true"
        />
        <span className="mt-2 h-5 w-full" aria-hidden="true" />
      </>
    ) : (
      <>
        {isMonogramIcon ? (
          <span className="shrink-0 transition-transform duration-200 group-hover/item:-translate-y-1 group-hover/item:scale-[1.04] motion-reduce:transform-none">
            <LinkMonogram title={link.title} url={link.url} size="lg" />
          </span>
        ) : (
          <span className="glass-icon-tile flex size-[60px] shrink-0 items-center justify-center rounded-[18px] transition-transform duration-200 group-hover/item:-translate-y-1 group-hover/item:scale-[1.04] motion-reduce:transform-none">
            {shouldShowImageIcon ? (
              <img
                src={link.icon}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="size-8 rounded-lg object-contain"
                onError={onImageIconError}
              />
            ) : (
              <Icon
                name={link.icon}
                size={26}
                className="text-[var(--surface-text)]"
              />
            )}
          </span>
        )}
        <span className="mt-2 w-full min-w-0 px-1">
          <span
            className="block truncate text-[13px] font-medium leading-5 text-[var(--tile-label-color)] [text-shadow:var(--tile-label-shadow)]"
            title={
              hasDescription
                ? `${link.title} — ${link.description}`
                : link.title
            }
          >
            {link.title}
          </span>
        </span>
      </>
    );

  return (
    <div className="group/item relative h-[104px] rounded-2xl">
      <div
        className={cn(
          "relative flex h-full rounded-2xl",
          LINK_ITEM_CLASS_BY_VARIANT[variant]
        )}
      >
        {variant === "default" && link.id && handleEditClick && (
          <button
            type="button"
            className="absolute right-1 top-1 z-10 flex size-7 cursor-pointer items-center justify-center rounded-lg text-[var(--surface-text-muted)] opacity-0 outline-none transition-[background-color,color,opacity] hover:bg-[var(--surface-hover-strong)] hover:text-[var(--surface-text)] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--surface-ring)] group-hover/item:opacity-100 group-focus-within/item:opacity-100"
            onClick={onEditClick}
            title={t("common.edit")}
            aria-label={t("common.edit")}
          >
            <Edit size={14} />
          </button>
        )}
        {variant === "default" && link.url ? (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
            className={LINK_TILE_CLASS_NAME}
            aria-label={`${link.title}, ${linkHostname}`}
          >
            {tileContent}
          </a>
        ) : (
          <div className={LINK_TILE_CLASS_NAME} aria-hidden="true">
            {tileContent}
          </div>
        )}
      </div>
    </div>
  );
}

// 避免拖拽坐标更新时重复构建稳定的网址卡片内容
export default memo(Index);
