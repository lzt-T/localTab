import { useState } from "react";
import { Folder } from "lucide-react";
import Icon from "@/newtab/components/Icon";
import type { Link, LinkGroupInfo } from "@/type/db";

interface FolderPreviewIconProps {
  link?: Link;
}

interface LinkFolderCardContentProps {
  linkGroup: LinkGroupInfo;
}

/** 渲染文件夹卡片中的单个网址预览图标。 */
function FolderPreviewIcon({ link }: FolderPreviewIconProps) {
  // 外部图标是否加载失败
  const [hasImageError, setHasImageError] = useState(false);
  if (!link) {
    return <span className="rounded-md border border-white/5 bg-white/[0.04]" />;
  }

  // 当前网址是否使用可展示的外部图标
  const shouldShowImage = link.icon.startsWith("http") && !hasImageError;
  return (
    <span className="flex items-center justify-center overflow-hidden rounded-md bg-white/[0.08]">
      {shouldShowImage ? (
        <img
          src={link.icon}
          alt=""
          className="size-4 rounded-sm object-contain"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <Icon
          name={link.icon.startsWith("http") ? "link" : link.icon || "link"}
          size={16}
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
  // 前四个预览位置对应的网址
  const previewLinks = Array.from({ length: 4 }, (_, previewIndex) =>
    linkGroup.links.at(previewIndex)
  );
  // 未展示在预览中的网址数量
  const overflowCount = Math.max(0, linkGroup.links.length - 4);

  return (
    <>
      <span className="relative grid size-14 grid-cols-2 grid-rows-2 gap-1 rounded-xl border border-white/10 bg-[rgba(16,18,22,0.82)] p-1.5 shadow-inner shadow-black/40">
        {linkGroup.links.length === 0 ? (
          <span className="col-span-2 row-span-2 flex items-center justify-center text-white/30">
            <Folder size={22} />
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
      <span className="w-full truncate text-center text-sm font-medium text-white/90">
        {linkGroup.name}
      </span>
    </>
  );
}
