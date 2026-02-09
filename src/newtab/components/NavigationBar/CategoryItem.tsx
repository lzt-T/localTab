import { useCallback } from "react";
import { useDrag, useDrop } from "react-dnd";
import Icon from "../Icon";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "../../../utils/base";
import type { Category } from "../../../type/db";

const ITEM_TYPE = "category";

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
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => ({ index, id: category.id, originalIndex: index }),
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
        "group/item relative w-full flex items-center justify-between cursor-pointer transition-opacity",
        isDragging ? "opacity-50" : "opacity-100"
      )}
      onClick={() => onChangeCurrentCategory(category.id)}
      data-handler-id={handlerId}
    >
      <div className="flex h-12 items-center gap-1 flex-1 min-w-0 overflow-x-hidden pl-3">
        <button
          className={cn(
            "flex shrink-0 items-center cursor-pointer justify-center w-10 h-10 rounded-full group-hover/item:bg-white/20 group-hover/item:scale-110 transition-all duration-300 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/50",
            isActive 
              ? "glass-style text-blue-200/90 group-hover/item:text-blue-100" 
              : "text-blue-200/60 group-hover/item:text-blue-200/80"
          )}
          aria-label={category.name}
        >
          <Icon name={category.icon} size={20} />
        </button>
        <div className={cn(
          "flex-1 min-w-0 text-left px-3 py-1.5 text-sm font-medium -translate-x-2 group-hover/item:translate-x-0 transition-all duration-200 overflow-hidden text-ellipsis whitespace-nowrap",
          isActive ? "text-white" : "text-white/70 group-hover/item:text-white/90"
        )}>
          {category.name}
        </div>
      </div>

      <div
        className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="text-white/70 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded p-1.5 hover:bg-white/20 transition-colors cursor-pointer"
          onClick={() => onEditClick(category.id)}
        >
          <Edit size={16} />
        </button>

        <button
          className="text-white/70 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded p-1.5 hover:bg-white/20 transition-colors cursor-pointer"
          onClick={() => onDeleteClick(category.id)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
