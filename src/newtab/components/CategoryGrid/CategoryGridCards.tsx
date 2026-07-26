import { useCallback, useRef, type ReactNode } from "react";
import { useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  DRAG_ITEM_TYPE,
  LINK_DROP_INTENT,
  type LinkDragItem,
  type LinkGroupDragItem,
} from "@/newtab/drag-and-drop";
import type { LinkGroupInfo } from "@/type/db";

interface CategoryGridItemSlotProps {
  index: number;
  isHidden?: boolean;
  linkDropFolder?: LinkGroupInfo;
  children: ReactNode;
  onClearLinkDropPreview: () => void;
  onHoverLink: (item: LinkDragItem, targetIndex: number) => void;
  onDropLink: (item: LinkDragItem, targetIndex: number) => void;
  onHoverFolder: (item: LinkGroupDragItem, targetIndex: number) => void;
  onDropFolder: (item: LinkGroupDragItem) => void;
}

interface EmptyCategoryDropZoneProps {
  categoryId: string;
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

/** 为没有卡片的分类提供网址与文件夹投放能力。 */
export function EmptyCategoryDropZone({
  categoryId,
  onMoveLink,
  onMoveCategoryItem,
}: EmptyCategoryDropZoneProps) {
  // 空分类投放反馈使用的本地化文案
  const { t } = useTranslation();
  // 空分类当前是否被可投放项目直接悬停
  const [{ isItemOver }, dropItem] = useDrop<
    LinkDragItem | LinkGroupDragItem,
    void,
    { isItemOver: boolean }
  >({
    accept: [DRAG_ITEM_TYPE.LINK, DRAG_ITEM_TYPE.LINK_GROUP],
    /** 将网址或文件夹保存为空分类的第一个项目。 */
    drop(item, monitor) {
      if (monitor.didDrop()) {
        return;
      }
      // 不同拖拽项目对应的空分类投放策略
      const dropStrategies = {
        [DRAG_ITEM_TYPE.LINK]: () => {
          // 当前网址拖拽数据
          const linkItem = item as LinkDragItem;
          linkItem.dropIntent = LINK_DROP_INTENT.MOVE;
          linkItem.mergeTargetLinkId = undefined;
          linkItem.targetLinkGroupId = undefined;
          linkItem.currentParentId = categoryId;
          linkItem.index = 0;
          void onMoveLink(linkItem.link.id, categoryId, 0);
        },
        [DRAG_ITEM_TYPE.LINK_GROUP]: () => {
          // 当前文件夹拖拽数据
          const linkGroupItem = item as LinkGroupDragItem;
          linkGroupItem.index = 0;
          linkGroupItem.targetIndex = 0;
          void onMoveCategoryItem(categoryId, linkGroupItem.id, 0);
        },
      };
      dropStrategies[item.type]();
    },
    collect: (monitor) => ({
      isItemOver: monitor.isOver({ shallow: true }),
    }),
  });

  /** 连接空分类内容区与项目投放目标。 */
  const connectDropZoneRef = useCallback(
    (node: HTMLDivElement | null) => {
      dropItem(node);
    },
    [dropItem]
  );

  return (
    <div
      ref={connectDropZoneRef}
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
  isHidden = false,
  linkDropFolder,
  children,
  onClearLinkDropPreview,
  onHoverLink,
  onDropLink,
  onHoverFolder,
  onDropFolder,
}: CategoryGridItemSlotProps) {
  // 网格位置元素引用
  const slotRef = useRef<HTMLDivElement>(null);
  // 网格间隙悬停状态与投放连接器
  const [{ isItemOver }, dropItem] = useDrop<
    LinkDragItem | LinkGroupDragItem,
    void,
    { isItemOver: boolean }
  >({
    accept: [DRAG_ITEM_TYPE.LINK, DRAG_ITEM_TYPE.LINK_GROUP],
    /** 根据卡片左右区域计算项目插入位置。 */
    hover(item, monitor) {
      if (!monitor.isOver({ shallow: true })) {
        return;
      }
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
      // 当前指针位置
      const clientOffset = monitor.getClientOffset();
      // 当前网格卡片边界
      const slotRect = slotRef.current?.getBoundingClientRect();
      if (!clientOffset || !slotRect) {
        return;
      }
      // 指针在卡片中的横向比例
      const horizontalRatio =
        (clientOffset.x - slotRect.left) / slotRect.width;
      // 卡片左侧插入前方，右侧插入后方
      const targetIndex = horizontalRatio < 0.5 ? index : index + 1;
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
      };
      hoverStrategies[item.type]();
    },
    /** 保存从网格间隙投放的项目位置。 */
    drop(item, monitor) {
      if (monitor.didDrop()) {
        return;
      }
      // 不同拖拽项目的网格间隙投放策略
      const dropStrategies = {
        [DRAG_ITEM_TYPE.LINK]: () =>
          onDropLink(item as LinkDragItem, (item as LinkDragItem).index),
        [DRAG_ITEM_TYPE.LINK_GROUP]: () =>
          onDropFolder(item as LinkGroupDragItem),
      };
      dropStrategies[item.type]();
    },
    collect: (monitor) => ({
      isItemOver: monitor.isOver({ shallow: true }),
    }),
  });

  /** 连接网格位置与项目投放区域。 */
  const connectSlotRef = useCallback(
    (node: HTMLDivElement | null) => {
      slotRef.current = node;
      dropItem(node);
    },
    [dropItem]
  );

  return (
    <div
      ref={connectSlotRef}
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
