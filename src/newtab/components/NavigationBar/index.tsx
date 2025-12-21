import Icon from "../Icon";
import { Plus } from "lucide-react";
import type { Category } from "../../../type/db";
import { cn } from "../../../utils/base";
import { Edit, Trash2 } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";

interface NavigationBarProps {
  activeCategoryId: string;
  categories: Category[];
  changeCurrentCategory: (categoryId: string) => void;
  addCategory: () => void;
  handleEditClick: (categoryId: string) => void;
  handleDeleteClick: (categoryId: string) => void;
  onMoveCategory: (dragIndex: number, hoverIndex: number) => void;
}

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

const ITEM_TYPE = "category";

function CategoryItem({
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
export default function Index(props: NavigationBarProps) {
  const {
    activeCategoryId,
    categories,
    changeCurrentCategory,
    addCategory,
    handleEditClick,
    handleDeleteClick,
    onMoveCategory,
  } = props;

  // 本地状态用于拖拽时的 UI 更新
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  // 当 categories 更新时同步本地状态
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  /* 编辑分类 */
  const onEditClick = useCallback(
    (categoryId: string) => {
      handleEditClick(categoryId);
    },
    [handleEditClick]
  );

  /* 删除分类 */
  const onDeleteClick = useCallback(
    (categoryId: string) => {
      handleDeleteClick(categoryId);
    },
    [handleDeleteClick]
  );

  /* 拖拽悬停时更新本地 UI */
  const onHover = useCallback((dragIndex: number, hoverIndex: number) => {
    setLocalCategories((prev) => {
      const newCategories = [...prev];
      const draggedCategory = newCategories[dragIndex];
      newCategories.splice(dragIndex, 1);
      newCategories.splice(hoverIndex, 0, draggedCategory);
      return newCategories;
    });
  }, []);

  /* 松开鼠标时更新数据库 */
  const onDrop = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      await onMoveCategory(dragIndex, hoverIndex);
    },
    [onMoveCategory]
  );

  return (
    <div className="relative w-full">
      <div
        className="flex flex-col items-center gap-3 w-full h-fit max-h-[70vh] overflow-y-auto overflow-x-visible"
        style={{ scrollbarWidth: "none" }}
      >
        {localCategories.map((category, index) => (
          <CategoryItem
            key={category.id}
            category={category}
            index={index}
            isActive={activeCategoryId === category.id}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            onChangeCurrentCategory={changeCurrentCategory}
            onHover={onHover}
            onDrop={onDrop}
          />
        ))}
      </div>

      {/* 添加按钮 */}
      <div className="flex justify-start mt-4 pl-3">
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-300 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
          aria-label="添加分类"
          onClick={addCategory}
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
