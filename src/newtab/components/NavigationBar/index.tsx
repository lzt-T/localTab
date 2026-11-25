import { Plus } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";
import type { CategoryInfo } from "@/type/db";
import Setting, { type SettingSection } from "@/newtab/components/Setting";
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
  isSettingsOpen: boolean;
  settingsSection: SettingSection;
  onSettingsOpenChange: (open: boolean) => void;
  onSettingsSectionChange: (section: SettingSection) => void;
  onDataChanged: () => Promise<void>;
}

// 分类导航末尾操作的统一视觉样式
const NAVIGATION_ACTION_CLASS =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--surface-text-secondary)] outline-none transition-[background-color,border-color,color,transform] duration-200 hover:border-[var(--surface-border-strong)] hover:bg-[var(--surface-hover-strong)] hover:text-[var(--surface-text)] active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--surface-ring)] motion-reduce:transform-none motion-reduce:transition-none";

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
    isSettingsOpen,
    settingsSection,
    onSettingsOpenChange,
    onSettingsSectionChange,
    onDataChanged,
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
      className="glass-style-floating flex h-full w-full flex-row items-center gap-2 overflow-hidden rounded-2xl p-1.5 md:flex-col md:items-stretch md:gap-0 md:rounded-[22px] md:p-0"
      aria-label={t("workspace.navigation")}
    >
      <div className="flex shrink-0 items-center px-1 md:border-b md:border-[var(--surface-divider)] md:px-4 md:py-3.5">
        <LocalTabMark className="flex min-w-0 items-center gap-2.5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-row items-center overflow-hidden md:min-h-0 md:flex-1 md:items-stretch">
        <div
          className="flex min-w-0 flex-1 flex-row items-center gap-1 overflow-x-auto overflow-y-hidden md:w-full md:flex-col md:items-stretch md:gap-0.5 md:overflow-x-hidden md:overflow-y-auto md:px-2 md:py-2.5 md:[mask-image:linear-gradient(to_bottom,transparent,black_10px,black_calc(100%-10px),transparent)]"
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
      </div>

      {/* 分类与全局设置入口 */}
      <div className="flex shrink-0 items-center gap-1.5 md:border-t md:border-[var(--surface-divider)] md:p-2.5">
        <button
          type="button"
          className="flex h-9 size-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-hover)] text-xs font-medium text-[var(--surface-text-secondary)] outline-none transition-[background-color,border-color,color,transform] duration-200 hover:border-[var(--surface-border-strong)] hover:bg-[var(--surface-hover-strong)] hover:text-[var(--surface-text)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--surface-ring)] motion-reduce:transform-none motion-reduce:transition-none md:w-auto md:flex-1 md:px-3"
          title={t("category.add")}
          aria-label={t("category.add")}
          onClick={addCategory}
        >
          <Plus size={15} className="shrink-0" />
          <span className="hidden truncate md:inline">{t("category.add")}</span>
        </button>
        <Setting
          open={isSettingsOpen}
          activeSection={settingsSection}
          triggerClassName={NAVIGATION_ACTION_CLASS}
          onOpenChange={onSettingsOpenChange}
          onSectionChange={onSettingsSectionChange}
          onDataChanged={onDataChanged}
        />
      </div>
    </nav>
  );
}
