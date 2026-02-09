import { useCallback } from "react";
import { useDrag, useDrop } from "react-dnd";
import LinkItem from "../LinkItem";
import { cn } from "@/lib/utils";
import type { Link } from "@/type/db";

const ITEM_TYPE = "link";

interface LinkItemWrapperProps {
  link: Link;
  index: number;
  onEditClick: (linkId: string) => void;
  onDeleteClick: (linkId: string) => void;
  onSkipClick: (url: string) => void;
  onHover: (dragIndex: number, hoverIndex: number) => void;
  onDrop: (dragIndex: number, hoverIndex: number) => void;
}

export default function LinkItemWrapper({
  link,
  index,
  onEditClick,
  onDeleteClick,
  onSkipClick,
  onHover,
  onDrop,
}: LinkItemWrapperProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => ({ index, id: link.id, originalIndex: index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (_item, monitor) => {
      // 如果拖拽被取消或没有成功放置，不执行任何操作
      if (!monitor.didDrop()) {
        return;
      }
    },
  });

  const [{ handlerId }, drop] = useDrop<
    { index: number; id: string; originalIndex: number },
    void,
    { handlerId: string | symbol | null }
  >({
    accept: ITEM_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number; id: string; originalIndex: number }) {
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      // 只更新 UI，不更新数据库
      onHover(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    drop(item: { index: number; id: string; originalIndex: number }) {
      // 使用当前的 index（经过 hover 调整后的位置）作为最终位置
      const finalIndex = index;
      const originalIndex = item.originalIndex;

      // 如果位置发生了变化，更新数据库
      if (originalIndex !== finalIndex) {
        onDrop(originalIndex, finalIndex);
      }
    },
  });

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      drag(drop(node));
    },
    [drag, drop]
  );

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
