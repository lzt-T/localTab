import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDrag, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { Edit, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import LinkList from "@/newtab/components/LinkList";
import LinkFolderCardContent from "@/newtab/components/LinkFolderCard/LinkFolderCardContent";
import {
  DRAG_ITEM_TYPE,
  LINK_DROP_INTENT,
  type LinkDragItem,
  type LinkGroupDragItem,
} from "@/newtab/drag-and-drop";
import type { LinkGroupInfo } from "@/type/db";

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
  onSkipLink,
  onMoveLink,
  onMergeLinks,
  onCancelLinkDrag,
  onEditFolder,
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

  // 文件夹拖动状态与连接器
  const [{ isDragging }, dragFolder, previewFolder] = useDrag<
    LinkGroupDragItem,
    void,
    { isDragging: boolean }
  >({
    type: DRAG_ITEM_TYPE.LINK_GROUP,
    item: () => {
      didDragRef.current = true;
      // 自定义拖拽预览尺寸
      const { width, height } = cardRef.current!.getBoundingClientRect();
      return {
        type: DRAG_ITEM_TYPE.LINK_GROUP,
        id: linkGroup.id,
        linkGroup,
        previewWidth: width,
        previewHeight: height,
        index,
        targetIndex: index,
      };
    },
    /** 按文件夹标识保持重排后拖动源的视觉状态。 */
    isDragging(monitor) {
      return monitor.getItem().id === linkGroup.id;
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
    // 关闭文件夹卡片的浏览器原生半透明拖拽快照
    previewFolder(getEmptyImage(), { captureDraggingState: true });
  }, [previewFolder]);

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
            "glass-style-border glass-style-card group/folder relative flex h-22 w-full cursor-pointer flex-col items-center justify-center rounded-xl px-3 py-2 text-white shadow-md shadow-black/10 outline-none transition-[transform,opacity,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[rgba(68,70,74,0.58)] hover:shadow-lg hover:shadow-black/20 focus-visible:ring-2 focus-visible:ring-blue-200/75",
            isDragging && "opacity-50",
            isLinkOver &&
              isJoinTarget &&
              "border-amber-200/70 bg-amber-200/15 ring-2 ring-amber-200/80",
            isLinkOver &&
              !isJoinTarget &&
              "border-blue-200/70 ring-2 ring-blue-200/70"
          )}
          aria-label={t("linkGroup.openFolder", { name: linkGroup.name })}
        >
          <LinkFolderCardContent linkGroup={linkGroup} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={10}
        collisionPadding={16}
        className="glass-style-overlay z-[60] w-[min(420px,calc(100vw-2rem))] p-3 text-white shadow-2xl shadow-black/55 ring-1 ring-white/10"
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
        </div>
        <div className="max-h-[264px] overflow-y-auto px-1 pb-2 pt-2">
          <LinkList
            categoryLinks={linkGroup.links}
            parentId={linkGroup.id}
            categoryId={categoryId}
            handleEditClick={onOpenEditLink}
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
