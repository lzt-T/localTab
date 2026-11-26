import { Folder } from "lucide-react";
import Icon from "@/newtab/components/Icon";
import LinkMonogram from "@/newtab/components/LinkMonogram";
import type { Link, LinkGroupInfo } from "@/type/db";
import { useLinkImageIcon } from "@/hooks/useLinkImageIcon";

interface FolderPreviewIconProps {
  link?: Link;
}

interface LinkFolderCardContentProps {
  linkGroup: LinkGroupInfo;
}

/** 渲染文件夹卡片中的单个网址预览图标。 */
function FolderPreviewIcon({ link }: FolderPreviewIconProps) {
  // 解析链接图片候选及默认空白占位图自动降级状态
  const {
    iconSrc,
    shouldShowImage,
    shouldShowMonogram,
    onImageLoad,
    onImageError,
  } = useLinkImageIcon(link?.icon ?? "", link?.url);

  if (!link) {
    return <span className="rounded-md border border-[var(--surface-border)] bg-[var(--surface-hover)]" />;
  }

  return (
    <span className="flex items-center justify-center overflow-hidden rounded-md bg-[var(--surface-hover)]">
      {shouldShowImage ? (
        <img
          src={iconSrc}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="size-3.5 rounded-[4px] object-contain"
          onLoad={onImageLoad}
          onError={onImageError}
        />
      ) : shouldShowMonogram ? (
        <LinkMonogram title={link.title} url={link.url} size="sm" />
      ) : (
        <Icon
          name={link.icon}
          size={13}
          className="text-[var(--surface-text)]"
        />
      )}
    </span>
  );
}

/** 渲染文件夹图标格与拖拽预览共用的内容。 */
export default function LinkFolderCardContent({
  linkGroup,
}: LinkFolderCardContentProps) {
  // 前四个预览位置对应的网址
  const previewLinks = Array.from({ length: 4 }, (_, previewIndex) =>
    linkGroup.links.at(previewIndex)
  );
  // 未展示在预览中的网址数量
  const overflowCount = Math.max(0, linkGroup.links.length - 4);

  return (
    <>
      <span className="glass-icon-tile relative grid size-[60px] shrink-0 grid-cols-2 grid-rows-2 gap-1.5 rounded-[18px] p-2 transition-transform duration-200 group-hover/folder:-translate-y-1 group-hover/folder:scale-[1.04] motion-reduce:transform-none">
        {linkGroup.links.length === 0 ? (
          <span className="col-span-2 row-span-2 flex items-center justify-center text-[var(--surface-text-secondary)]">
            <Folder size={24} />
          </span>
        ) : (
          previewLinks.map((link, previewIndex) => (
            <FolderPreviewIcon key={link?.id ?? previewIndex} link={link} />
          ))
        )}
        {overflowCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 rounded-full border border-[var(--glass-popover-border)] bg-[var(--glass-popover-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--surface-text)] shadow-lg">
            +{overflowCount}
          </span>
        )}
      </span>
      <span className="mt-2 w-full min-w-0 px-1 text-center">
        <span
          className="block truncate text-[13px] font-medium leading-5 text-[var(--tile-label-color)] [text-shadow:var(--tile-label-shadow)]"
          title={linkGroup.name}
        >
          {linkGroup.name}
        </span>
      </span>
    </>
  );
}
