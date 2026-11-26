import Icon from "@/newtab/components/Icon";
import LinkMonogram from "@/newtab/components/LinkMonogram";
import { useLinkImageIcon } from "@/hooks/useLinkImageIcon";
import type { Link } from "@/type/db";

interface DockLinkIconProps {
  link: Link;
}

/** 渲染 Dock 网址使用的图片图标或回退图标。 */
export default function DockLinkIcon({ link }: DockLinkIconProps) {
  // 解析链接图片候选及默认空白占位图自动降级状态
  const {
    iconSrc,
    shouldShowImage: shouldShowImageIcon,
    shouldShowMonogram,
    onImageLoad: handleImageIconLoad,
    onImageError: handleImageIconError,
  } = useLinkImageIcon(link.icon, link.url);

  return shouldShowImageIcon ? (
    <img
      src={iconSrc}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      className="size-6 rounded-md object-contain"
      onLoad={handleImageIconLoad}
      onError={handleImageIconError}
    />
  ) : shouldShowMonogram ? (
    <LinkMonogram title={link.title} url={link.url} size="md" />
  ) : (
    <Icon
      name={link.icon}
      size={22}
      className="text-[var(--surface-text-secondary)]"
    />
  );
}
