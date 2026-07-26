import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Folder } from "lucide-react";
import Icon from "@/newtab/components/Icon";
import type { Link, LinkGroupInfo } from "@/type/db";
import { isImageIcon } from "@/utils/icon";

interface FolderPreviewIconProps {
  link?: Link;
}

interface LinkFolderCardContentProps {
  linkGroup: LinkGroupInfo;
}

/** 渲染文件夹卡片中的单个网址预览图标。 */
function FolderPreviewIcon({ link }: FolderPreviewIconProps) {
  // 加载失败的图片图标值
  const [failedImageIcon, setFailedImageIcon] = useState("");
  if (!link) {
    return <span className="rounded-md border border-white/5 bg-white/[0.04]" />;
  }

  // 当前网址是否使用可展示的图片图标
  const hasImageIcon = isImageIcon(link.icon);
  // 当前图片图标是否可以展示
  const shouldShowImage =
    hasImageIcon && failedImageIcon !== link.icon;
  return (
    <span className="flex items-center justify-center overflow-hidden rounded-md bg-white/[0.08]">
      {shouldShowImage ? (
        <img
          src={link.icon}
          alt=""
          className="size-3 rounded-sm object-contain"
          onError={() => setFailedImageIcon(link.icon)}
        />
      ) : (
        <Icon
          name={hasImageIcon ? "link" : link.icon || "link"}
          size={12}
          className="text-blue-100/90"
        />
      )}
    </span>
  );
}

/** 渲染文件夹卡片与拖拽预览共用的内容。 */
export default function LinkFolderCardContent({
  linkGroup,
}: LinkFolderCardContentProps) {
  // 文件夹摘要的本地化文案
  const { t } = useTranslation();
  // 前四个预览位置对应的网址
  const previewLinks = Array.from({ length: 4 }, (_, previewIndex) =>
    linkGroup.links.at(previewIndex)
  );
  // 未展示在预览中的网址数量
  const overflowCount = Math.max(0, linkGroup.links.length - 4);

  return (
    <>
      <span className="relative mb-1 grid size-8 shrink-0 grid-cols-2 grid-rows-2 gap-px rounded-md bg-white/[0.06] p-1">
        {linkGroup.links.length === 0 ? (
          <span className="col-span-2 row-span-2 flex items-center justify-center text-white/30">
            <Folder size={18} />
          </span>
        ) : (
          previewLinks.map((link, previewIndex) => (
            <FolderPreviewIcon key={link?.id ?? previewIndex} link={link} />
          ))
        )}
        {overflowCount > 0 && (
          <span className="absolute -right-2 -top-2 rounded-full border border-white/15 bg-black/85 px-1.5 py-0.5 text-[10px] font-semibold text-white/85 shadow-lg">
            +{overflowCount}
          </span>
        )}
      </span>
      <span className="w-full min-w-0 text-center">
        <span className="block truncate text-sm font-medium leading-5 text-white/90">
          {linkGroup.name}
        </span>
        <span className="block truncate text-xs leading-4 text-white/50">
          {t("workspace.websiteCount", { count: linkGroup.links.length })}
        </span>
      </span>
    </>
  );
}
