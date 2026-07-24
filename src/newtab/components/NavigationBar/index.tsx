import { Plus } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { CategoryInfo } from "@/type/db";
import CategoryItem from "@/newtab/components/NavigationBar/CategoryItem";

interface NavigationBarProps {
  activeCategoryId: string;
  categories: CategoryInfo[];
  changeCurrentCategory: (categoryId: string) => void;
  addCategory: () => void;
  handleEditClick: (categoryId: string) => void;
  handleDeleteClick: (categoryId: string) => void;
  onMoveCategory: (dragIndex: number, hoverIndex: number) => void;
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
}

/** 渲染支持分类排序和网格项目跨区投放的侧栏。 */
export default function Index(props: NavigationBarProps) {
  // 侧栏界面的本地化文案
  const { t } = useTranslation();
  // 侧栏展示数据和交互回调
  const {
    activeCategoryId,
    categories,
    changeCurrentCategory,
    addCategory,
    handleEditClick,
    handleDeleteClick,
    onMoveCategory,
    onMoveLink,
    onMoveCategoryItem,
  } = props;

  // 本地状态用于拖拽时的 UI 更新
  const [localCategories, setLocalCategories] =
    useState<CategoryInfo[]>(categories);

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
      // 当前拖拽预览使用的分类副本
      const newCategories = [...prev];
      // 正在调整位置的分类
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
        className="flex flex-col items-center gap-1.5 w-full h-fit max-h-[70vh] overflow-y-auto overflow-x-visible"
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
            onMoveLink={onMoveLink}
            onMoveCategoryItem={onMoveCategoryItem}
            onHover={onHover}
            onDrop={onDrop}
          />
        ))}
      </div>

      {/* 添加按钮 */}
      <div className="mt-2 flex justify-start pl-5">
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/15 text-white/70 hover:text-white transition-all duration-200 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
          aria-label={t("category.add")}
          title={t("category.add")}
          onClick={addCategory}
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
