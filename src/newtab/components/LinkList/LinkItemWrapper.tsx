import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDrag, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import LinkItem from "@/newtab/components/LinkItem";
import { cn } from "@/lib/utils";
import type { Link } from "@/type/db";
import {
  DRAG_ITEM_TYPE,
  LINK_DROP_INTENT,
  type LinkDragItem,
} from "@/newtab/drag-and-drop";

interface LinkItemWrapperProps {
  link: Link;
  index: number;
  onEditClick: (linkId: string) => void;
  onDeleteClick: (linkId: string) => void;
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
  onDeleteClick,
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
  // 网址卡片拖动状态与连接器
  const [{ isDragging }, drag, preview] = useDrag<
    LinkDragItem,
    void,
    { isDragging: boolean }
  >({
    type: DRAG_ITEM_TYPE.LINK,
    item: () => {
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
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (_item, monitor) => {
      // 取消拖拽时从数据库状态恢复所有分类的临时预览。
      if (!monitor.didDrop()) {
        void onCancelDrag();
      }
    },
  });

  // 卡片投放状态与连接器
  const [{ handlerId, isOver }, drop] = useDrop<
    LinkDragItem,
    void,
    { handlerId: string | symbol | null; isOver: boolean }
  >({
    accept: DRAG_ITEM_TYPE.LINK,
    /** 收集当前卡片投放状态。 */
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver({ shallow: true }),
      };
    },
    /** 根据鼠标区域更新排序或合并意图。 */
    hover(item, monitor) {
      if (item.link.id === link.id) {
        item.dropIntent = LINK_DROP_INTENT.MOVE;
        item.mergeTargetLinkId = undefined;
        item.targetLinkGroupId = undefined;
        setIsMergeTarget(false);
        onHover(item, index);
        return;
      }

      // 当前鼠标位置
      const clientOffset = monitor.getClientOffset();
      // 当前网址卡片边界
      const cardRect = elementRef.current?.getBoundingClientRect();
      if (!clientOffset || !cardRect) {
        return;
      }
      // 鼠标在卡片内的横向比例
      const horizontalRatio =
        (clientOffset.x - cardRect.left) / cardRect.width;
      // 鼠标在卡片内的纵向比例
      const verticalRatio = (clientOffset.y - cardRect.top) / cardRect.height;
      // 卡片中心是否满足合并投放范围
      const isCenterTarget =
        horizontalRatio >= 0.25 &&
        horizontalRatio <= 0.75 &&
        verticalRatio >= 0.2 &&
        verticalRatio <= 0.8;
      // 当前两个网址是否允许创建新文件夹
      const canMergeLinks =
        allowMerge &&
        link.parentId === parentId &&
        isCenterTarget;

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
      // 卡片左半侧插入其前方，右半侧插入其后方
      const targetIndex = horizontalRatio < 0.5 ? index : index + 1;
      onHover(item, targetIndex);
    },
    /** 按当前意图分发网址排序或合并操作。 */
    drop(item) {
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
  });

  // 同时连接网址卡片的拖动与投放能力
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      elementRef.current = node;
      drag(drop(node));
    },
    [drag, drop]
  );

  useEffect(() => {
    // 玻璃态卡片的浏览器原生拖拽快照会产生矩形角块，改由自定义预览层渲染。
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  useEffect(() => {
    if (!isOver) {
      setIsMergeTarget(false);
    }
  }, [isOver]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-2xl transition-[opacity,box-shadow]",
        isMergeTarget && "ring-2 ring-amber-300/90 shadow-lg shadow-amber-300/20",
        isOver &&
          !isMergeTarget &&
          !isDragging &&
          "ring-2 ring-blue-200/70 shadow-lg shadow-blue-200/10",
        isDragging ? "opacity-50" : "opacity-100"
      )}
      data-handler-id={handlerId}
    >
      <LinkItem
        link={link}
        handleEditClick={onEditClick}
        handleDeleteClick={onDeleteClick}
        handleSkipClick={onSkipClick}
      />
      {isMergeTarget && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-2xl bg-amber-300/10 pb-2">
          <span className="rounded-full border border-amber-200/40 bg-black/70 px-2.5 py-1 text-xs font-medium text-amber-100 backdrop-blur-xl">
            {t("linkGroup.mergeHint")}
          </span>
        </div>
      )}
    </div>
  );
}
