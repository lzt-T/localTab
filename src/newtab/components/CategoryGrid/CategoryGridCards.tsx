import { type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Bookmark, Link2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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
  onOpenAddLink: () => void;
  onOpenBookmarkImport: () => void;
}

/** 渲染空分类引导操作和拖拽投放反馈。 */
export function EmptyCategoryPlaceholder({
  isItemOver,
  onOpenAddLink,
  onOpenBookmarkImport,
}: EmptyCategoryPlaceholderProps) {
  // 空分类引导文案的本地化工具
  const { t } = useTranslation();

  if (isItemOver) {
    return (
      <div
        aria-label={t("workspace.dropIntoEmptyCategory")}
        className="pointer-events-none col-span-full flex min-h-[clamp(12rem,36vh,22rem)] items-center justify-center rounded-2xl border border-dashed border-blue-300/60 bg-blue-400/10 px-4 text-center text-sm font-medium text-blue-100 transition-colors motion-reduce:transition-none"
      >
        {t("workspace.dropIntoEmptyCategory")}
      </div>
    );
  }

  return (
    <div className="col-span-full flex min-h-[clamp(14rem,40vh,24rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-dashed border-white/15 bg-[rgba(38,40,44,0.44)] px-6 py-7 text-center shadow-[0_14px_36px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-blue-200/85">
          <Link2 size={20} aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-white/90">
          {t("workspace.emptyCategoryTitle")}
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-white/55">
          {t("workspace.emptyCategoryDescription")}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            onClick={onOpenAddLink}
            className="h-10 cursor-pointer rounded-xl bg-blue-500/85 px-4 text-sm text-white hover:bg-blue-400 focus-visible:ring-blue-300/40"
          >
            <Plus size={16} />
            {t("link.addAction")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onOpenBookmarkImport}
            className="h-10 cursor-pointer rounded-xl border-white/15 bg-white/[0.04] px-4 text-sm text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Bookmark size={15} />
            {t("workspace.importBookmarksAction")}
          </Button>
        </div>
      </div>
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
        "relative -my-2.5 py-2.5 transition-opacity",
        isHidden && "opacity-0"
      )}
    >
      {isItemOver && linkDropFolder && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-2.5 top-2.5 rounded-xl outline-2 outline-offset-[8px] outline-blue-300/80 shadow-lg shadow-blue-400/15"
        />
      )}
      {children}
    </div>
  );
}
