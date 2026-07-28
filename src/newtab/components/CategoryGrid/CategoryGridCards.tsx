import { type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  DRAG_ITEM_TYPE,
  DROP_TARGET_TYPE,
  CARD_DROP_REGION,
  LINK_DROP_INTENT,
  STATIC_DROPPABLE_RESIZE_OBSERVER_CONFIG,
  createDndId,
  getHorizontalDropRegion,
  type DndTargetData,
  type LinkDragItem,
  type LinkGroupDragItem,
} from "@/newtab/drag-and-drop";
import type { LinkGroupInfo } from "@/type/db";

interface CategoryGridItemSlotProps {
  index: number;
  scopeId: string;
  slotId: string;
  isHidden?: boolean;
  linkDropFolder?: LinkGroupInfo;
  children: ReactNode;
  onClearLinkDropPreview: () => void;
  onHoverLink: (item: LinkDragItem, targetIndex: number) => void;
  onDropLink: (item: LinkDragItem, targetIndex: number) => void;
  onHoverFolder: (item: LinkGroupDragItem, targetIndex: number) => void;
  onDropFolder: (item: LinkGroupDragItem) => void;
}

interface EmptyCategoryPlaceholderProps {
  isItemOver: boolean;
}

/** 渲染没有卡片时的分类投放提示。 */
export function EmptyCategoryPlaceholder({
  isItemOver,
}: EmptyCategoryPlaceholderProps) {
  // 空分类投放反馈使用的本地化文案
  const { t } = useTranslation();

  return (
    <div
      aria-label={t("workspace.dropIntoEmptyCategory")}
      className={cn(
        "col-span-full flex min-h-[clamp(10rem,35vh,22rem)] items-center justify-center rounded-xl border border-transparent px-4 text-center text-sm font-medium text-transparent transition-[border-color,background-color,color] motion-reduce:transition-none",
        isItemOver &&
          "border-sky-400/60 bg-sky-400/10 text-sky-100"
      )}
    >
      {t("workspace.dropIntoEmptyCategory")}
    </div>
  );
}

/** 为每个网格位置提供文件夹排序投放能力。 */
export function CategoryGridItemSlot({
  index,
  scopeId,
  slotId,
  isHidden = false,
  linkDropFolder,
  children,
  onClearLinkDropPreview,
  onHoverLink,
  onDropLink,
  onHoverFolder,
  onDropFolder,
}: CategoryGridItemSlotProps) {
  // 网格位置携带的投放目标数据
  const targetData: DndTargetData = {
    type: DROP_TARGET_TYPE.GRID_SLOT,
    accepts: [DRAG_ITEM_TYPE.LINK, DRAG_ITEM_TYPE.LINK_GROUP],
    scopeId,
    /** 标识网格槽位当前对应的左右侧或文件夹投放区域。 */
    getDragMoveKey(item, context) {
      if (item.type === DRAG_ITEM_TYPE.LINK && linkDropFolder) {
        return createDndId("folder", linkDropFolder.id);
      }
      return getHorizontalDropRegion(context);
    },
    /** 根据卡片左右区域计算项目插入位置。 */
    onDragMove(item, context) {
      if (item.type === DRAG_ITEM_TYPE.LINK && linkDropFolder) {
        // 自动展开文件夹过渡区内的当前网址拖拽数据
        const linkItem = item as LinkDragItem;
        linkItem.dropIntent = LINK_DROP_INTENT.MOVE;
        linkItem.mergeTargetLinkId = undefined;
        linkItem.targetLinkGroupId = linkDropFolder.id;
        linkItem.currentParentId = linkDropFolder.id;
        linkItem.index = linkDropFolder.links.length;
        onClearLinkDropPreview();
        return;
      }
      // 卡片左侧插入前方，右侧插入后方
      const targetIndex =
        getHorizontalDropRegion(context) === CARD_DROP_REGION.BEFORE
          ? index
          : index + 1;
      // 不同拖拽项目的网格间隙悬停策略
      const hoverStrategies = {
        [DRAG_ITEM_TYPE.LINK]: () => {
          // 当前网址拖拽数据
          const linkItem = item as LinkDragItem;
          linkItem.dropIntent = LINK_DROP_INTENT.MOVE;
          linkItem.mergeTargetLinkId = undefined;
          linkItem.targetLinkGroupId = undefined;
          onHoverLink(linkItem, targetIndex);
        },
        [DRAG_ITEM_TYPE.LINK_GROUP]: () =>
          onHoverFolder(item as LinkGroupDragItem, targetIndex),
        [DRAG_ITEM_TYPE.CATEGORY]: () => undefined,
        [DRAG_ITEM_TYPE.DOCK_LINK]: () => undefined,
      };
      hoverStrategies[item.type]();
    },
    /** 保存从网格间隙投放的项目位置。 */
    onDrop(item) {
      // 不同拖拽项目的网格间隙投放策略
      const dropStrategies = {
        [DRAG_ITEM_TYPE.LINK]: () =>
          onDropLink(item as LinkDragItem, (item as LinkDragItem).index),
        [DRAG_ITEM_TYPE.LINK_GROUP]: () =>
          onDropFolder(item as LinkGroupDragItem),
        [DRAG_ITEM_TYPE.CATEGORY]: () => undefined,
        [DRAG_ITEM_TYPE.DOCK_LINK]: () => undefined,
      };
      dropStrategies[item.type]();
    },
  };
  // 网格间隙悬停状态与投放连接器
  const { isOver: isItemOver, setNodeRef } = useDroppable({
    id: createDndId("grid-slot", scopeId, slotId),
    data: targetData,
    resizeObserverConfig: STATIC_DROPPABLE_RESIZE_OBSERVER_CONFIG,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative -m-2.5 rounded-[26px] p-2.5 transition-[opacity,box-shadow]",
        isHidden && "opacity-0",
        isItemOver &&
          linkDropFolder &&
          "ring-2 ring-amber-200/80 shadow-lg shadow-amber-200/10"
      )}
    >
      {children}
    </div>
  );
}
