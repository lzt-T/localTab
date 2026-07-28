import { Plus } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CategoryInfo } from "@/type/db";
import Setting from "@/newtab/components/Setting";
import CategoryItem from "@/newtab/components/NavigationBar/CategoryItem";
import LocalTabMark from "@/newtab/components/LocalTabMark";
import { createDndId } from "@/newtab/drag-and-drop";

interface NavigationBarProps {
  activeCategoryId: string;
  categories: CategoryInfo[];
  changeCurrentCategory: (categoryId: string) => void;
  addCategory: () => void;
  handleEditClick: (categoryId: string) => void;
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

// 分类导航末尾操作的统一视觉样式
const NAVIGATION_ACTION_CLASS =
  "flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/[0.07] text-white/65 outline-none transition-[background-color,color,transform] duration-200 hover:bg-white/15 hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-white/60 motion-reduce:transform-none motion-reduce:transition-none";

/** 渲染支持分类排序和网格项目跨区投放的侧栏。 */
export default function NavigationBar(props: NavigationBarProps) {
  // 侧栏界面的本地化文案
  const { t } = useTranslation();
  // 侧栏展示数据和交互回调
  const {
    activeCategoryId,
    categories,
    changeCurrentCategory,
    addCategory,
    handleEditClick,
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

  /** 取消分类拖拽时恢复服务端顺序。 */
  const onCancel = useCallback(() => {
    setLocalCategories(categories);
  }, [categories]);

  // 当前分类对应的 dnd-kit 排序标识
  const categoryIds = localCategories.map((category) =>
    createDndId("category", category.id)
  );

  return (
    <nav
      className="flex h-full w-full flex-row items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(20,22,26,0.58)] p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.2)] backdrop-blur-2xl md:flex-col md:items-stretch md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none"
      aria-label={t("workspace.navigation")}
    >
      <LocalTabMark
        className="flex shrink-0 justify-center px-1 md:mb-2 md:justify-start md:pl-5"
        compact
      />
      <div
        className="flex min-w-0 flex-1 flex-row items-center gap-1 overflow-x-auto overflow-y-hidden md:max-h-[62vh] md:flex-col md:items-stretch md:overflow-x-visible md:overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <SortableContext items={categoryIds} strategy={rectSortingStrategy}>
          {localCategories.map((category, index) => (
            <CategoryItem
              key={category.id}
              category={category}
              index={index}
              isActive={activeCategoryId === category.id}
              onEditClick={onEditClick}
              onChangeCurrentCategory={changeCurrentCategory}
              onMoveLink={onMoveLink}
              onMoveCategoryItem={onMoveCategoryItem}
              onHover={onHover}
              onDrop={onDrop}
              onCancel={onCancel}
            />
          ))}
        </SortableContext>
      </div>

      {/* 分类与全局设置入口 */}
      <div className="flex shrink-0 items-center gap-1 md:mt-2 md:pl-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={NAVIGATION_ACTION_CLASS}
              aria-label={t("category.add")}
              onClick={addCategory}
            >
              <Plus size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            className="border border-white/10 bg-[#202328] text-white shadow-lg motion-reduce:animate-none"
            arrowClassName="bg-[#202328] fill-[#202328]"
          >
            {t("category.add")}
          </TooltipContent>
        </Tooltip>
        <Setting triggerClassName={NAVIGATION_ACTION_CLASS} />
      </div>
    </nav>
  );
}
