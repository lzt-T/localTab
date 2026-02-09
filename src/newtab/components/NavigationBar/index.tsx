import { Plus } from "lucide-react";
import type { Category } from "../../../type/db";
import { useCallback, useState, useEffect } from "react";
import CategoryItem from "./CategoryItem";

interface NavigationBarProps {
  activeCategoryId: string;
  categories: Category[];
  changeCurrentCategory: (categoryId: string) => void;
  addCategory: () => void;
  handleEditClick: (categoryId: string) => void;
  handleDeleteClick: (categoryId: string) => void;
  onMoveCategory: (dragIndex: number, hoverIndex: number) => void;
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
