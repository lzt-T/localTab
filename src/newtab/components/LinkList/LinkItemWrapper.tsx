import { useCallback, useEffect, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import LinkItem from "@/newtab/components/LinkItem";
import { cn } from "@/lib/utils";
import type { Link } from "@/type/db";
import { DRAG_ITEM_TYPE, type LinkDragItem } from "@/newtab/drag-and-drop";

interface LinkItemWrapperProps {
  link: Link;
  index: number;
  onEditClick: (linkId: string) => void;
  onDeleteClick: (linkId: string) => void;
  onSkipClick: (url: string) => void;
  onHover: (item: LinkDragItem, hoverIndex: number) => void;
  onDrop: (item: LinkDragItem, targetIndex: number) => void;
  onCancelDrag: () => Promise<void>;
}

export default function LinkItemWrapper({
  link,
  index,
  onEditClick,
  onDeleteClick,
  onSkipClick,
  onHover,
  onDrop,
  onCancelDrag,
}: LinkItemWrapperProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag, preview] = useDrag<
    LinkDragItem,
    void,
    { isDragging: boolean }
  >({
    type: DRAG_ITEM_TYPE.LINK,
    item: () => {
      const { width, height } = elementRef.current!.getBoundingClientRect();

      return {
        type: DRAG_ITEM_TYPE.LINK,
        link,
        previewWidth: width,
        previewHeight: height,
        sourceCategoryId: link.parentId,
        currentCategoryId: link.parentId,
        index,
        originalIndex: index,
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

  const [{ handlerId }, drop] = useDrop<
    LinkDragItem,
    void,
    { handlerId: string | symbol | null }
  >({
    accept: DRAG_ITEM_TYPE.LINK,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item) {
      if (item.currentCategoryId === link.parentId && item.index === index) {
        return;
      }

      // 悬停阶段只维护本地预览，松开后再写入数据库。
      onHover(item, index);
    },
    drop(item) {
      onDrop(item, index);
    },
  });

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

  return (
    <div
      ref={ref}
      className={cn(
        "transition-opacity",
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
    </div>
  );
}
