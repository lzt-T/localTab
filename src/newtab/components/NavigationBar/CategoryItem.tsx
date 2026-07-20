import { useCallback, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import Icon from "@/newtab/components/Icon";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "@/utils/base";
import type { Category } from "@/type/db";
import {
  DRAG_ITEM_TYPE,
  type CategoryDragItem,
  type DragItem,
} from "@/newtab/drag-and-drop";

const LINK_HOVER_DELAY_MS = 500;

interface CategoryItemProps {
  category: Category;
  index: number;
  isActive: boolean;
  onEditClick: (categoryId: string) => void;
  onDeleteClick: (categoryId: string) => void;
  onChangeCurrentCategory: (categoryId: string) => void;
  onHover: (dragIndex: number, hoverIndex: number) => void;
  onDrop: (dragIndex: number, hoverIndex: number) => void;
}

export default function CategoryItem({
  category,
  index,
  isActive,
  onEditClick,
  onDeleteClick,
  onChangeCurrentCategory,
  onHover,
  onDrop,
}: CategoryItemProps) {
  const [{ isDragging }, drag] = useDrag<
    CategoryDragItem,
    void,
    { isDragging: boolean }
  >({
    type: DRAG_ITEM_TYPE.CATEGORY,
    item: () => ({
      type: DRAG_ITEM_TYPE.CATEGORY,
      index,
      id: category.id,
      originalIndex: index,
    }),
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

  const hoverStrategies: Record<
    DragItem["type"],
    (dragItem: DragItem) => void
  > = {
    [DRAG_ITEM_TYPE.CATEGORY]: (dragItem) => {
      const categoryItem = dragItem as CategoryDragItem;
      if (categoryItem.index === index) {
        return;
      }

      onHover(categoryItem.index, index);
      categoryItem.index = index;
    },
    [DRAG_ITEM_TYPE.LINK]: () => undefined,
  };

  const dropStrategies: Record<
    DragItem["type"],
    (dragItem: DragItem) => void
  > = {
    [DRAG_ITEM_TYPE.CATEGORY]: (dragItem) => {
      const categoryItem = dragItem as CategoryDragItem;
      if (categoryItem.originalIndex !== index) {
        onDrop(categoryItem.originalIndex, index);
      }
    },
    [DRAG_ITEM_TYPE.LINK]: () => undefined,
  };

  const [{ handlerId, isLinkOver }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: string | symbol | null; isLinkOver: boolean }
  >({
    accept: [DRAG_ITEM_TYPE.CATEGORY, DRAG_ITEM_TYPE.LINK],
    canDrop: (item) => item.type === DRAG_ITEM_TYPE.CATEGORY,
    collect(monitor) {
      const item = monitor.getItem<DragItem>();
      return {
        handlerId: monitor.getHandlerId(),
        isLinkOver:
          monitor.isOver({ shallow: true }) &&
          item?.type === DRAG_ITEM_TYPE.LINK,
      };
    },
    hover(item) {
      hoverStrategies[item.type](item);
    },
    drop(item) {
      dropStrategies[item.type](item);
    },
  });

  useEffect(() => {
    if (!isLinkOver || isActive) {
      return;
    }

    // 链接停留一段时间后再切换分类，避免经过侧栏时误触。
    const timer = window.setTimeout(() => {
      onChangeCurrentCategory(category.id);
    }, LINK_HOVER_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [category.id, isActive, isLinkOver, onChangeCurrentCategory]);

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
        "group/item relative mx-2 flex w-[calc(100%-1rem)] items-center justify-between rounded-lg cursor-pointer transition-[opacity,background-color,box-shadow] duration-200",
        isDragging ? "opacity-50" : "opacity-100",
        isActive
          ? "bg-white/[0.08] backdrop-blur-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/[0.1]"
          : "hover:bg-white/[0.05]",
        isLinkOver && "bg-white/10 hover:bg-white/10"
      )}
      onClick={() => onChangeCurrentCategory(category.id)}
      data-handler-id={handlerId}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1 top-2 bottom-2 w-0.5 rounded-full bg-blue-200 transition-opacity duration-200",
          isActive || isLinkOver ? "opacity-100" : "opacity-0"
        )}
      />
      <div className="flex h-12 items-center gap-1 flex-1 min-w-0 overflow-x-hidden pl-3">
        <button
          className={cn(
            "flex shrink-0 items-center cursor-pointer justify-center w-10 h-10 rounded-full transition-colors duration-200 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/50",
            isActive
              ? "text-blue-100"
              : "text-blue-200/60 group-hover/item:text-blue-100",
            isLinkOver && "bg-white/15 text-blue-100"
          )}
          aria-label={category.name}
        >
          <Icon name={category.icon} size={20} />
        </button>
        <div
          className={cn(
            "flex-1 min-w-0 text-left px-2 py-1.5 text-sm font-medium transition-colors duration-200 overflow-hidden text-ellipsis whitespace-nowrap",
            isActive
              ? "font-semibold text-white"
              : "text-white/70 group-hover/item:text-white/90"
          )}
        >
          {category.name}
        </div>
      </div>

      <div
        className={cn(
          "mr-2 flex items-center gap-1 transition-opacity duration-200",
          isLinkOver
            ? "pointer-events-none opacity-0"
            : "opacity-0 group-hover/item:opacity-70"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="text-white/60 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
          onClick={() => onEditClick(category.id)}
        >
          <Edit size={16} />
        </button>

        <button
          className="text-white/60 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
          onClick={() => onDeleteClick(category.id)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
