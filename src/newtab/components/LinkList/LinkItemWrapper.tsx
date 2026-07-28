import { useCallback, useMemo, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import LinkItem from "@/newtab/components/LinkItem";
import { cn } from "@/lib/utils";
import type { Link } from "@/type/db";
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

interface LinkItemWrapperProps {
  link: Link;
  index: number;
  onEditClick: (linkId: string) => void;
  onSkipClick: (url: string) => void;
  onHover: (item: LinkDragItem, hoverIndex: number) => void;
  onDrop: (item: LinkDragItem, targetIndex: number) => void;
  onMergeLinks: (
    categoryId: string,
    targetLinkId: string,
    draggedLinkId: string
  ) => Promise<void>;
  onCancelDrag: () => Promise<void>;
  allowMerge: boolean;
  onEnterMergeTarget?: () => void;
  categoryId: string;
  parentId: string;
}

/** 渲染支持排序和文件夹投放的网址卡片。 */
export default function LinkItemWrapper({
  link,
  index,
  onEditClick,
  onSkipClick,
  onHover,
  onDrop,
  onMergeLinks,
  onCancelDrag,
  allowMerge,
  onEnterMergeTarget,
  categoryId,
  parentId,
}: LinkItemWrapperProps) {
  // 拖拽提示的本地化文案
  const { t } = useTranslation();
  // 卡片容器引用
  const elementRef = useRef<HTMLDivElement>(null);
  // 当前卡片是否作为合并目标
  const [isMergeTarget, setIsMergeTarget] = useState(false);
  // 网址卡片携带的拖拽源数据
  const sourceData = useMemo<DndSourceData>(
    () => ({
      itemType: DRAG_ITEM_TYPE.LINK,
      /** 创建网址拖拽开始时的稳定会话数据。 */
      createDragItem() {
        // 自定义拖拽预览尺寸
        const { width, height } = elementRef.current!.getBoundingClientRect();
        return {
          type: DRAG_ITEM_TYPE.LINK,
          link,
          previewWidth: width,
          previewHeight: height,
          sourceParentId: link.parentId,
          currentParentId: link.parentId,
          index,
          originalIndex: index,
          dropIntent: LINK_DROP_INTENT.MOVE,
        };
      },
      /** 取消拖拽时从数据库状态恢复临时预览。 */
      onCancel() {
        void onCancelDrag();
      },
    }),
    [index, link, onCancelDrag]
  );
  // 网址卡片拖动状态与连接器
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef: setDragNodeRef,
  } = useDraggable({
    id: createDndId("page-link", link.id),
    data: sourceData,
  });
  // 网址卡片携带的投放目标数据
  const targetData = useMemo<DndTargetData>(
    () => ({
      type: DROP_TARGET_TYPE.LINK_CARD,
      accepts: [DRAG_ITEM_TYPE.LINK],
      scopeId: parentId,
      priority: allowMerge ? 80 : 90,
      /** 标识网址卡片当前对应的自身、排序或合并区域。 */
      getDragMoveKey(dragItem, context) {
        // 当前网址拖拽数据
        const item = dragItem as LinkDragItem;
        if (item.link.id === link.id) {
          return "self";
        }
        // 当前卡片中心是否允许合并网址
        const canMergeLinks =
          allowMerge &&
          link.parentId === parentId &&
          isCardCenterDropRegion(context);
        return canMergeLinks
          ? CARD_DROP_REGION.CENTER
          : getHorizontalDropRegion(context);
      },
      /** 根据指针区域更新排序或合并意图。 */
      onDragMove(dragItem, context) {
        // 当前网址拖拽数据
        const item = dragItem as LinkDragItem;
        if (item.link.id === link.id) {
          item.dropIntent = LINK_DROP_INTENT.MOVE;
          item.mergeTargetLinkId = undefined;
          item.targetLinkGroupId = undefined;
          setIsMergeTarget(false);
          onHover(item, index);
          return;
        }
        // 当前两个网址是否允许创建新文件夹
        const canMergeLinks =
          allowMerge &&
          link.parentId === parentId &&
          isCardCenterDropRegion(context);
        if (canMergeLinks) {
          item.dropIntent = LINK_DROP_INTENT.MERGE;
          item.mergeTargetLinkId = link.id;
          item.targetLinkGroupId = undefined;
          onEnterMergeTarget?.();
          setIsMergeTarget(true);
          return;
        }
        item.dropIntent = LINK_DROP_INTENT.MOVE;
        item.mergeTargetLinkId = undefined;
        item.targetLinkGroupId = undefined;
        setIsMergeTarget(false);
        // 卡片左半侧插入前方，右半侧插入后方
        const targetIndex =
          getHorizontalDropRegion(context) === CARD_DROP_REGION.BEFORE
            ? index
            : index + 1;
        onHover(item, targetIndex);
      },
      /** 按当前意图分发网址排序或合并操作。 */
      onDrop(dragItem) {
        // 当前网址拖拽数据
        const item = dragItem as LinkDragItem;
        // 不同投放意图对应的处理策略
        const dropStrategies = {
          [LINK_DROP_INTENT.MOVE]: () => onDrop(item, item.index),
          [LINK_DROP_INTENT.MERGE]: () => {
            if (item.mergeTargetLinkId) {
              void onMergeLinks(
                categoryId,
                item.mergeTargetLinkId,
                item.link.id
              );
            }
          },
        };
        dropStrategies[item.dropIntent]();
      },
    }),
    [
      allowMerge,
      categoryId,
      index,
      link,
      onDrop,
      onEnterMergeTarget,
      onHover,
      onMergeLinks,
      parentId,
    ]
  );
  // 卡片投放状态与连接器
  const { isOver, setNodeRef: setDropNodeRef } = useDroppable({
    id: createDndId("link-card", parentId, link.id),
    data: targetData,
    resizeObserverConfig: STATIC_DROPPABLE_RESIZE_OBSERVER_CONFIG,
  });
  // 当前卡片是否展示为有效合并目标
  const shouldShowMergeTarget = isOver && isMergeTarget;

  // 同时连接网址卡片的拖动与投放能力
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      elementRef.current = node;
      setDragNodeRef(node);
      setDropNodeRef(node);
    },
    [setDragNodeRef, setDropNodeRef]
  );

  return (
    <div
      ref={ref}
      {...attributes}
      {...listeners}
      className={cn(
        "relative rounded-2xl transition-shadow",
        shouldShowMergeTarget &&
          "ring-2 ring-amber-300/90 shadow-lg shadow-amber-300/20",
        isOver &&
          !shouldShowMergeTarget &&
          !isDragging &&
          "ring-2 ring-blue-200/70 shadow-lg shadow-blue-200/10"
      )}
    >
      <LinkItem
        link={link}
        handleEditClick={onEditClick}
        handleSkipClick={onSkipClick}
        variant={isDragging ? "drag-placeholder" : "default"}
      />
      {shouldShowMergeTarget && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-2xl bg-amber-300/10 pb-2">
          <span className="rounded-full border border-amber-200/40 bg-black/70 px-2.5 py-1 text-xs font-medium text-amber-100 backdrop-blur-xl">
            {t("linkGroup.mergeHint")}
          </span>
        </div>
      )}
    </div>
  );
}
