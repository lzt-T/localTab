import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
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
  DROP_TARGET_TYPE,
  CARD_DROP_REGION,
  LINK_DROP_INTENT,
  STATIC_DROPPABLE_RESIZE_OBSERVER_CONFIG,
  createDndId,
  getHorizontalDropRegion,
  isCardCenterDropRegion,
  type DndSourceData,
  type DndTargetData,
  type LinkDragItem,
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

interface FolderPopoverDropZoneProps {
  linkGroup: LinkGroupInfo;
  children: ReactNode;
  onClearLinkDropPreview: () => void;
  onMoveLink: (
    linkId: string,
    targetParentId: string,
    targetIndex: number
  ) => Promise<void>;
}

/** 保持网址进入文件夹浮层期间的连续投放目标。 */
function FolderPopoverDropZone({
  linkGroup,
  children,
  onClearLinkDropPreview,
  onMoveLink,
}: FolderPopoverDropZoneProps) {
  // 文件夹浮层标题与内边距使用的末尾投放策略
  const targetData: DndTargetData = {
    type: DROP_TARGET_TYPE.FOLDER_CONTENT,
    accepts: [DRAG_ITEM_TYPE.LINK],
    scopeId: linkGroup.id,
    /** 将浮层过渡区域保持为当前文件夹的末尾位置。 */
    onDragMove(dragItem) {
      // 当前网址拖拽数据
      const item = dragItem as LinkDragItem;
      item.dropIntent = LINK_DROP_INTENT.MOVE;
      item.mergeTargetLinkId = undefined;
      item.targetLinkGroupId = linkGroup.id;
      item.currentParentId = linkGroup.id;
      item.index = linkGroup.links.length;
      onClearLinkDropPreview();
    },
    /** 将浮层过渡区域内松开的网址追加到文件夹末尾。 */
    onDrop(dragItem) {
      // 当前网址拖拽数据
      const item = dragItem as LinkDragItem;
      void onMoveLink(item.link.id, linkGroup.id, linkGroup.links.length);
    },
  };
  // 动态挂载的文件夹浮层投放连接器
  const { setNodeRef } = useDroppable({
    id: createDndId("folder-content", linkGroup.id),
    data: targetData,
  });

  return (
    <div ref={setNodeRef} className="relative -m-3 p-3">
      {children}
    </div>
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

  // 文件夹携带的拖拽源数据
  const sourceData = useMemo<DndSourceData>(
    () => ({
      itemType: DRAG_ITEM_TYPE.LINK_GROUP,
      /** 创建文件夹拖拽开始时的稳定会话数据。 */
      createDragItem() {
        didDragRef.current = true;
        // 自定义拖拽预览尺寸
        const { width, height } = cardRef.current!.getBoundingClientRect();
        onManualOpenChange(linkGroup.id, false);
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
      /** 恢复取消拖拽产生的临时排序。 */
      onCancel() {
        void onCancelLinkDrag();
      },
    }),
    [index, linkGroup, onCancelLinkDrag, onManualOpenChange]
  );
  // 文件夹拖动状态与连接器
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef: setDragNodeRef,
  } = useDraggable({
    id: createDndId("page-folder", linkGroup.id),
    data: sourceData,
  });
  // 文件夹卡片携带的投放目标数据
  const targetData = useMemo<DndTargetData>(
    () => ({
      type: DROP_TARGET_TYPE.FOLDER_CARD,
      accepts: [DRAG_ITEM_TYPE.LINK],
      scopeId: categoryId,
      /** 标识文件夹卡片当前对应的排序或加入区域。 */
      getDragMoveKey(_dragItem, context) {
        // 当前卡片是否作为文件夹加入目标
        const shouldJoinFolder =
          isAutoOpenTarget || isCardCenterDropRegion(context);
        return shouldJoinFolder
          ? CARD_DROP_REGION.CENTER
          : getHorizontalDropRegion(context);
      },
      /** 根据卡片区域区分加入文件夹和网格排序。 */
      onDragMove(dragItem, context) {
        // 当前网址拖拽数据
        const item = dragItem as LinkDragItem;
        // 文件夹中心投放范围
        const isCenterTarget = isCardCenterDropRegion(context);
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
        const targetIndex =
          getHorizontalDropRegion(context) === CARD_DROP_REGION.BEFORE
            ? index
            : index + 1;
        onHoverLink(item, targetIndex);
      },
      /** 按投放区域移动网址。 */
      onDrop(dragItem) {
        // 当前网址拖拽数据
        const item = dragItem as LinkDragItem;
        // 文件夹中心或主网格对应的投放策略
        const dropStrategies = {
          folder: () =>
            void onMoveLink(
              item.link.id,
              linkGroup.id,
              linkGroup.links.length
            ),
          grid: () => onDropLink(item, item.index),
        };
        // 当前网址投放目标
        const dropTarget =
          item.targetLinkGroupId === linkGroup.id ? "folder" : "grid";
        dropStrategies[dropTarget]();
        onCancelPendingAutoOpen(linkGroup.id);
        setIsJoinTarget(false);
      },
    }),
    [
      categoryId,
      index,
      isAutoOpenTarget,
      linkGroup,
      onCancelPendingAutoOpen,
      onClearLinkDropPreview,
      onDropLink,
      onHoverLink,
      onMoveLink,
      onRequestAutoOpen,
    ]
  );
  // 网址投放状态与连接器
  const { isOver: isLinkOver, setNodeRef: setDropNodeRef } = useDroppable({
    id: createDndId("folder-card", categoryId, linkGroup.id),
    data: targetData,
    resizeObserverConfig: STATIC_DROPPABLE_RESIZE_OBSERVER_CONFIG,
  });

  /** 连接文件夹卡片的拖动和网址投放能力。 */
  const connectCardRef = useCallback(
    (node: HTMLButtonElement | null) => {
      cardRef.current = node;
      setDragNodeRef(node);
      setDropNodeRef(node);
    },
    [setDragNodeRef, setDropNodeRef]
  );

  /** 忽略拖拽结束后产生的浮层打开事件。 */
  const onOpenChange = (nextOpen: boolean) => {
    if (!didDragRef.current) {
      onManualOpenChange(linkGroup.id, nextOpen);
    }
  };

  useEffect(() => {
    if (isDragging) {
      return;
    }
    // 拖拽结束后延迟解除点击抑制
    const releaseTimer = window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
    return () => window.clearTimeout(releaseTimer);
  }, [isDragging]);

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
          {...attributes}
          {...listeners}
          className={cn(
            "group/folder relative flex h-22 w-full flex-col items-center justify-center rounded-xl px-3 py-2 text-white outline-none transition-[transform,background-color,border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-blue-200/75",
            isDragging
              ? "cursor-grabbing border border-dashed border-white/20 bg-white/[0.035] shadow-inner shadow-black/10 backdrop-blur-xl"
              : "glass-style-border glass-style-card cursor-pointer shadow-md shadow-black/10 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[rgba(68,70,74,0.58)] hover:shadow-lg hover:shadow-black/20",
            isLinkOver &&
              isJoinTarget &&
              "border-amber-200/70 bg-amber-200/15 ring-2 ring-amber-200/80",
            isLinkOver &&
              !isJoinTarget &&
              "border-blue-200/70 ring-2 ring-blue-200/70"
          )}
          aria-label={t("linkGroup.openFolder", { name: linkGroup.name })}
        >
          {!isDragging && <LinkFolderCardContent linkGroup={linkGroup} />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={10}
        collisionPadding={16}
        className="glass-style-overlay z-[60] w-[min(420px,calc(100vw-2rem))] p-3 text-white shadow-2xl shadow-black/55 ring-1 ring-white/10"
      >
        <FolderPopoverDropZone
          linkGroup={linkGroup}
          onClearLinkDropPreview={onClearLinkDropPreview}
          onMoveLink={onMoveLink}
        >
          <div className="mb-3 flex h-9 items-center gap-2 border-b border-white/10 pb-3">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {linkGroup.name}
            </span>
            <span className="text-xs text-white/45">
              {linkGroup.links.length}
            </span>
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
              reserveDropPreviewSpace={isAutoOpenTarget}
            />
          </div>
        </FolderPopoverDropZone>
      </PopoverContent>
    </Popover>
  );
}
