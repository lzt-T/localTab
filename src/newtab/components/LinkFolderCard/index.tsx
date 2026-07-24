import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDrag, useDrop } from "react-dnd";
import { Edit, Folder, Plus, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Icon from "@/newtab/components/Icon";
import LinkList from "@/newtab/components/LinkList";
import {
  DRAG_ITEM_TYPE,
  LINK_DROP_INTENT,
  type LinkDragItem,
  type LinkGroupDragItem,
} from "@/newtab/drag-and-drop";
import type { Link, LinkGroupInfo } from "@/type/db";

interface FolderPreviewIconProps {
  link?: Link;
}

interface LinkFolderCardProps {
  linkGroup: LinkGroupInfo;
  categoryId: string;
  index: number;
  onHoverLink: (item: LinkDragItem, targetIndex: number) => void;
  onDropLink: (item: LinkDragItem, targetIndex: number) => void;
  onClearLinkDropPreview: () => void;
  onEnterFolderContent: (item: LinkDragItem) => void;
  isManuallyOpen: boolean;
  autoOpenFolderId: string | null;
  onManualOpenChange: (folderId: string, isOpen: boolean) => void;
  onRequestAutoOpen: (folderId: string) => void;
  onCancelPendingAutoOpen: (folderId: string) => void;
  onOpenAddLink: (parentId: string) => void;
  onOpenEditLink: (linkId: string) => void;
  onDeleteLink: (linkId: string) => void;
  onSkipLink: (url: string) => void;
  onMoveLink: (
    linkId: string,
    targetParentId: string,
    targetIndex: number
  ) => Promise<void>;
  onMergeLinks: (
    categoryId: string,
    targetLinkId: string,
    draggedLinkId: string
  ) => Promise<void>;
  onCancelLinkDrag: () => Promise<void>;
  onEditFolder: (linkGroup: LinkGroupInfo) => void;
  onDeleteFolder: (linkGroup: LinkGroupInfo) => void;
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

/** 渲染可拖拽、可展开的网址文件夹卡片。 */
export default function LinkFolderCard({
  linkGroup,
  categoryId,
  index,
  onHoverLink,
  onDropLink,
  onClearLinkDropPreview,
  onEnterFolderContent,
  isManuallyOpen,
  autoOpenFolderId,
  onManualOpenChange,
  onRequestAutoOpen,
  onCancelPendingAutoOpen,
  onOpenAddLink,
  onOpenEditLink,
  onDeleteLink,
  onSkipLink,
  onMoveLink,
  onMergeLinks,
  onCancelLinkDrag,
  onEditFolder,
  onDeleteFolder,
}: LinkFolderCardProps) {
  // 文件夹界面的本地化文案
  const { t } = useTranslation();
  // 文件夹卡片元素引用
  const cardRef = useRef<HTMLButtonElement>(null);
  // 当前拖拽是否应阻止打开浮层
  const didDragRef = useRef(false);
  // 当前网址是否投放到文件夹中心
  const [isJoinTarget, setIsJoinTarget] = useState(false);
  // 当前文件夹是否由网址拖拽自动展开
  const isAutoOpenTarget = autoOpenFolderId === linkGroup.id;
  // 手动或拖拽自动展开后的实际浮层状态
  const isPopoverOpen = autoOpenFolderId
    ? isAutoOpenTarget
    : isManuallyOpen;
  // 前四个预览位置对应的网址
  const previewLinks = Array.from({ length: 4 }, (_, previewIndex) =>
    linkGroup.links.at(previewIndex)
  );
  // 未展示在预览中的网址数量
  const overflowCount = Math.max(0, linkGroup.links.length - 4);

  // 文件夹拖动状态与连接器
  const [{ isDragging }, dragFolder] = useDrag<
    LinkGroupDragItem,
    void,
    { isDragging: boolean }
  >({
    type: DRAG_ITEM_TYPE.LINK_GROUP,
    item: () => {
      didDragRef.current = true;
      return {
        type: DRAG_ITEM_TYPE.LINK_GROUP,
        id: linkGroup.id,
        categoryId,
        index,
        targetIndex: index,
      };
    },
    /** 恢复取消拖拽产生的临时排序并解除点击抑制。 */
    end: (_item, monitor) => {
      if (!monitor.didDrop()) {
        void onCancelLinkDrag();
      }
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  // 网址投放状态与连接器
  const [{ isLinkOver }, dropLink] = useDrop<
    LinkDragItem,
    void,
    { isLinkOver: boolean }
  >({
    accept: DRAG_ITEM_TYPE.LINK,
    /** 根据卡片区域区分加入文件夹和网格排序。 */
    hover(item, monitor) {
      // 当前鼠标位置
      const clientOffset = monitor.getClientOffset();
      // 文件夹卡片边界
      const cardRect = cardRef.current?.getBoundingClientRect();
      if (!clientOffset || !cardRect) {
        return;
      }
      // 鼠标在文件夹卡片内的横向比例
      const horizontalRatio =
        (clientOffset.x - cardRect.left) / cardRect.width;
      // 鼠标在文件夹卡片内的纵向比例
      const verticalRatio = (clientOffset.y - cardRect.top) / cardRect.height;
      // 文件夹中心投放范围
      const isCenterTarget =
        horizontalRatio >= 0.25 &&
        horizontalRatio <= 0.75 &&
        verticalRatio >= 0.2 &&
        verticalRatio <= 0.8;
      // 自动展开后整张卡片保持为文件夹投放过渡区域
      const shouldJoinFolder = isAutoOpenTarget || isCenterTarget;
      setIsJoinTarget(shouldJoinFolder);
      item.dropIntent = LINK_DROP_INTENT.MOVE;
      item.mergeTargetLinkId = undefined;
      item.targetLinkGroupId = shouldJoinFolder ? linkGroup.id : undefined;
      if (shouldJoinFolder) {
        onClearLinkDropPreview();
        if (isCenterTarget) {
          onRequestAutoOpen(linkGroup.id);
        }
        item.currentParentId = linkGroup.id;
        item.index = linkGroup.links.length;
        return;
      }
      onCancelPendingAutoOpen(linkGroup.id);
      // 卡片左侧插入前方，右侧插入后方
      const targetIndex = horizontalRatio < 0.5 ? index : index + 1;
      onHoverLink(item, targetIndex);
    },
    /** 按投放区域移动网址。 */
    drop(item) {
      // 文件夹中心或主网格对应的投放策略
      const dropStrategies = {
        folder: () =>
          void onMoveLink(item.link.id, linkGroup.id, linkGroup.links.length),
        grid: () => onDropLink(item, item.index),
      };
      // 当前网址投放目标
      const dropTarget =
        item.targetLinkGroupId === linkGroup.id ? "folder" : "grid";
      dropStrategies[dropTarget]();
      onCancelPendingAutoOpen(linkGroup.id);
      setIsJoinTarget(false);
    },
    collect: (monitor) => ({
      isLinkOver: monitor.isOver({ shallow: true }),
    }),
  });

  /** 连接文件夹卡片的拖动和网址投放能力。 */
  const connectCardRef = useCallback(
    (node: HTMLButtonElement | null) => {
      cardRef.current = node;
      dragFolder(dropLink(node));
    },
    [dragFolder, dropLink]
  );

  /** 忽略拖拽结束后产生的浮层打开事件。 */
  const onOpenChange = (nextOpen: boolean) => {
    if (!didDragRef.current) {
      onManualOpenChange(linkGroup.id, nextOpen);
    }
  };

  useEffect(() => {
    if (!isLinkOver) {
      onCancelPendingAutoOpen(linkGroup.id);
    }
  }, [isLinkOver, linkGroup.id, onCancelPendingAutoOpen]);

  return (
    <Popover open={isPopoverOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          ref={connectCardRef}
          className={cn(
            "glass-style-border group/folder relative flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-white shadow-lg shadow-black/10 outline-none transition-[transform,opacity,background-color,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-[rgba(68,70,74,0.66)] hover:shadow-xl hover:shadow-black/20 focus-visible:ring-2 focus-visible:ring-blue-200/80",
            isDragging && "opacity-35",
            isLinkOver &&
              isJoinTarget &&
              "border-amber-200/70 bg-amber-200/15 ring-2 ring-amber-200/80",
            isLinkOver &&
              !isJoinTarget &&
              "border-blue-200/70 ring-2 ring-blue-200/70"
          )}
          aria-label={t("linkGroup.openFolder", { name: linkGroup.name })}
        >
          <span className="relative grid size-[66px] grid-cols-2 grid-rows-2 gap-1 rounded-2xl border border-white/10 bg-[rgba(16,18,22,0.88)] p-2 shadow-inner shadow-black/40">
            {linkGroup.links.length === 0 ? (
              <span className="col-span-2 row-span-2 flex items-center justify-center text-white/30">
                <Folder size={26} />
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
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={10}
        collisionPadding={16}
        className="glass-style-border z-[60] w-[420px] border-white/15 bg-[rgba(24,26,30,0.96)] p-3 text-white shadow-2xl shadow-black/55 ring-1 ring-white/10 backdrop-blur-2xl"
      >
        <div className="mb-3 flex h-9 items-center gap-2 border-b border-white/10 pb-3">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
            {linkGroup.name}
          </span>
          <span className="text-xs text-white/45">{linkGroup.links.length}</span>
          <button
            type="button"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-white/60 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-200/70"
            onClick={() => onOpenAddLink(linkGroup.id)}
            aria-label={t("linkGroup.addLink")}
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-white/60 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-200/70"
            onClick={() => onEditFolder(linkGroup)}
            aria-label={t("common.edit")}
          >
            <Edit size={15} />
          </button>
          <button
            type="button"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-red-300/70 outline-none transition-colors hover:bg-red-400/10 hover:text-red-200 focus-visible:ring-2 focus-visible:ring-red-300/70"
            onClick={() => onDeleteFolder(linkGroup)}
            aria-label={t("common.delete")}
          >
            <Trash2 size={15} />
          </button>
        </div>
        <div className="max-h-[264px] overflow-y-auto px-1 pb-2 pt-2">
          <LinkList
            categoryLinks={linkGroup.links}
            parentId={linkGroup.id}
            categoryId={categoryId}
            handleEditClick={onOpenEditLink}
            handleDeleteClick={onDeleteLink}
            handleSkipClick={onSkipLink}
            onMoveLink={onMoveLink}
            onMergeLinks={onMergeLinks}
            onCancelDrag={onCancelLinkDrag}
            onEnterFolderContent={onEnterFolderContent}
            onOpenAddLink={() => onOpenAddLink(linkGroup.id)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
