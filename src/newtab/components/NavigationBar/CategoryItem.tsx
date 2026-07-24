import { useCallback, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import Icon from "@/newtab/components/Icon";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryInfo } from "@/type/db";
import {
  DRAG_ITEM_TYPE,
  type CategoryDragItem,
  type DragItem,
  type LinkDragItem,
  type LinkGroupDragItem,
} from "@/newtab/drag-and-drop";

// 网格项目拖过分类时触发切换的等待时间
const GRID_ITEM_HOVER_DELAY_MS = 500;

interface CategoryItemProps {
  category: CategoryInfo;
  index: number;
  isActive: boolean;
  onEditClick: (categoryId: string) => void;
  onDeleteClick: (categoryId: string) => void;
  onChangeCurrentCategory: (categoryId: string) => void;
  onMoveLink: (
    linkId: string,
    targetParentId: string,
    targetIndex: number
  ) => Promise<void>;
  onMoveCategoryItem: (
    categoryId: string,
    itemId: string,
    targetIndex: number
  ) => Promise<void>;
  onHover: (dragIndex: number, hoverIndex: number) => void;
  onDrop: (dragIndex: number, hoverIndex: number) => void;
}

/** 渲染支持分类排序和网格项目跨区切换的侧栏分类项。 */
export default function CategoryItem({
  category,
  index,
  isActive,
  onEditClick,
  onDeleteClick,
  onChangeCurrentCategory,
  onMoveLink,
  onMoveCategoryItem,
  onHover,
  onDrop,
}: CategoryItemProps) {
  // 分类拖动状态与连接器
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

  // 不同拖拽项目的悬停处理策略
  const hoverStrategies: Record<
    DragItem["type"],
    (dragItem: DragItem) => void
  > = {
    [DRAG_ITEM_TYPE.CATEGORY]: (dragItem) => {
      // 当前拖动的分类数据
      const categoryItem = dragItem as CategoryDragItem;
      if (categoryItem.index === index) {
        return;
      }

      onHover(categoryItem.index, index);
      categoryItem.index = index;
    },
    [DRAG_ITEM_TYPE.LINK]: () => undefined,
    [DRAG_ITEM_TYPE.LINK_GROUP]: () => undefined,
  };

  // 不同拖拽项目的投放处理策略
  const dropStrategies: Record<
    DragItem["type"],
    (dragItem: DragItem) => void
  > = {
    [DRAG_ITEM_TYPE.CATEGORY]: (dragItem) => {
      // 当前投放的分类数据
      const categoryItem = dragItem as CategoryDragItem;
      if (categoryItem.originalIndex !== index) {
        onDrop(categoryItem.originalIndex, index);
      }
    },
    [DRAG_ITEM_TYPE.LINK]: (dragItem) => {
      // 当前投放的网址数据
      const linkItem = dragItem as LinkDragItem;
      onChangeCurrentCategory(category.id);
      void onMoveLink(linkItem.link.id, category.id, category.items.length);
    },
    [DRAG_ITEM_TYPE.LINK_GROUP]: (dragItem) => {
      // 当前投放的分组数据
      const linkGroupItem = dragItem as LinkGroupDragItem;
      onChangeCurrentCategory(category.id);
      void onMoveCategoryItem(
        category.id,
        linkGroupItem.id,
        category.items.length
      );
    },
  };

  // 分类投放状态与连接器
  const [{ handlerId, isGridItemOver }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: string | symbol | null; isGridItemOver: boolean }
  >({
    accept: [
      DRAG_ITEM_TYPE.CATEGORY,
      DRAG_ITEM_TYPE.LINK,
      DRAG_ITEM_TYPE.LINK_GROUP,
    ],
    /** 收集分类和网格项目经过侧栏时的状态。 */
    collect(monitor) {
      // 当前经过分类的拖拽项目
      const item = monitor.getItem<DragItem>();
      return {
        handlerId: monitor.getHandlerId(),
        isGridItemOver:
          monitor.isOver({ shallow: true }) &&
          (item?.type === DRAG_ITEM_TYPE.LINK ||
            item?.type === DRAG_ITEM_TYPE.LINK_GROUP),
      };
    },
    /** 按拖拽项目类型分发悬停行为。 */
    hover(item) {
      hoverStrategies[item.type](item);
    },
    /** 按拖拽项目类型分发投放行为。 */
    drop(item) {
      dropStrategies[item.type](item);
    },
  });

  useEffect(() => {
    if (!isGridItemOver || isActive) {
      return;
    }

    // 网格项目停留一段时间后再切换分类，避免经过侧栏时误触。
    const timer = window.setTimeout(() => {
      onChangeCurrentCategory(category.id);
    }, GRID_ITEM_HOVER_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [category.id, isActive, isGridItemOver, onChangeCurrentCategory]);

  // 同时连接分类的拖动与投放能力
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
        "group/item relative mx-4 flex w-[calc(100%-2rem)] items-center justify-between rounded-lg cursor-pointer transition-[opacity,background-color,border-color,box-shadow] duration-200",
        isDragging ? "opacity-50" : "opacity-100",
        isActive
          ? "glass-style-border shadow-lg shadow-black/10 hover:bg-[rgba(68,70,74,0.66)] hover:border-white/20"
          : "hover:bg-white/[0.06]",
        isGridItemOver && "bg-white/10 hover:bg-white/10"
      )}
      onClick={() => onChangeCurrentCategory(category.id)}
      data-handler-id={handlerId}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1 top-2 bottom-2 w-0.5 rounded-full bg-blue-200 transition-opacity duration-200",
          isActive || isGridItemOver ? "opacity-100" : "opacity-0"
        )}
      />
      <div className="flex h-10 items-center gap-0.5 flex-1 min-w-0 overflow-x-hidden pl-3 pr-2 transition-[padding] duration-200 group-hover/item:pr-[72px]">
        <button
          className={cn(
            "flex shrink-0 items-center cursor-pointer justify-center w-8 h-8 rounded-full transition-colors duration-200 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/50",
            isActive
              ? "text-blue-100"
              : "text-blue-200/75 group-hover/item:text-blue-100",
            isGridItemOver && "bg-white/15 text-blue-100"
          )}
          aria-label={category.name}
        >
          <Icon name={category.icon} size={20} />
        </button>
        <div
          className={cn(
            "flex-1 min-w-0 text-left px-1 py-1 text-sm font-medium transition-colors duration-200 overflow-hidden text-ellipsis whitespace-nowrap",
            isActive
              ? "font-semibold text-white"
              : "text-white/80 group-hover/item:text-white/90"
          )}
        >
          {category.name}
        </div>
      </div>

      <div
        className={cn(
          "absolute right-2 flex items-center gap-1 transition-opacity duration-200",
          isGridItemOver
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
