import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDrag, useDrop } from "react-dnd";
import Icon from "@/newtab/components/Icon";
import { Edit } from "lucide-react";
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
  onChangeCurrentCategory,
  onMoveLink,
  onMoveCategoryItem,
  onHover,
  onDrop,
}: CategoryItemProps) {
  // 分类操作的本地化文案
  const { t } = useTranslation();
  // 分类内包含文件夹子项的全部网址数量
  const linkCount =
    category.links.length +
    category.linkGroups.reduce(
      (totalCount, linkGroup) => totalCount + linkGroup.links.length,
      0
    );
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
    [DRAG_ITEM_TYPE.DOCK_LINK]: () => undefined,
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
    [DRAG_ITEM_TYPE.DOCK_LINK]: () => undefined,
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

  /** 打开当前分类的编辑界面。 */
  function onEditCategoryClick() {
    onEditClick(category.id);
  }

  return (
    <div
      ref={ref}
      className={cn(
        "group/item relative flex shrink-0 items-center rounded-xl transition-[opacity,background-color,border-color,box-shadow] duration-200 md:mx-4 md:w-[calc(100%-2rem)]",
        isDragging ? "opacity-50" : "opacity-100",
        isActive
          ? "bg-white/10 md:glass-style-border md:shadow-lg md:shadow-black/10"
          : "hover:bg-white/[0.07]",
        isGridItemOver && "bg-white/15 ring-1 ring-blue-200/45"
      )}
      data-handler-id={handlerId}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-0 left-3 right-3 h-px rounded-full bg-blue-200 transition-opacity duration-200 md:bottom-2 md:left-1 md:right-auto md:top-2 md:h-auto md:w-px",
          isActive || isGridItemOver ? "opacity-100" : "opacity-0"
        )}
      />
      <button
        type="button"
        className="flex h-10 min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-xl px-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:px-3"
        onClick={() => onChangeCurrentCategory(category.id)}
        aria-current={isActive ? "page" : undefined}
        aria-label={`${category.name}, ${t("workspace.websiteCount", {
          count: linkCount,
        })}`}
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            isActive
              ? "bg-white/12 text-blue-100"
              : "text-white/55 group-hover/item:bg-white/[0.06] group-hover/item:text-white/85",
            isGridItemOver && "bg-white/15 text-blue-100"
          )}
        >
          <Icon name={category.icon} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-medium transition-colors",
              isActive
                ? "text-white"
                : "text-white/65 group-hover/item:text-white"
            )}
          >
            {category.name}
          </span>
        </span>
      </button>

      <button
        type="button"
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/45 outline-none transition-[background-color,color,opacity] hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 md:mr-2 md:opacity-0 md:group-hover/item:opacity-100 md:group-focus-within/item:opacity-100"
        onClick={onEditCategoryClick}
        title={t("common.edit")}
        aria-label={t("common.edit")}
      >
        <Edit size={15} />
      </button>
    </div>
  );
}
