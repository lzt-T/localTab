import { useState } from "react";
import Icon from "@/newtab/components/Icon";
import { isImageIcon } from "@/utils/icon";
import type { Link } from "@/type/db";

interface DockLinkIconProps {
  link: Link;
}

/** 渲染 Dock 网址使用的图片图标或回退图标。 */
export default function DockLinkIcon({ link }: DockLinkIconProps) {
  // 加载失败的图片图标值
  const [failedImageIcon, setFailedImageIcon] = useState("");
  // 当前网址是否配置了图片图标
  const hasImageIcon = isImageIcon(link.icon);
  // 当前网址是否可以展示图片图标
  const shouldShowImageIcon =
    hasImageIcon && failedImageIcon !== link.icon;

  /** 标记当前图片图标加载失败。 */
  function handleImageIconError() {
    setFailedImageIcon(link.icon);
  }

  return shouldShowImageIcon ? (
    <img
      src={link.icon}
      alt=""
      className="size-6 rounded-md object-contain"
      onError={handleImageIconError}
    />
  ) : (
    <Icon
      name={hasImageIcon ? "link" : link.icon || "link"}
      size={22}
      className="text-white/75"
    />
  );
}
