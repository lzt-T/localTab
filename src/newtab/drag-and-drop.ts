import type { ClientRect } from "@dnd-kit/core";
import type { Link, LinkGroupInfo } from "@/type/db";

// 页面支持的拖拽项目类型
export const DRAG_ITEM_TYPE = {
  CATEGORY: "category",
  LINK: "link",
  LINK_GROUP: "link-group",
  DOCK_LINK: "dock-link",
} as const;

// 页面拖拽项目类型
export type DragItemType =
  (typeof DRAG_ITEM_TYPE)[keyof typeof DRAG_ITEM_TYPE];

// 网址卡片的投放意图
export const LINK_DROP_INTENT = {
  MOVE: "move",
  MERGE: "merge",
} as const;

// 网址卡片投放意图类型
export type LinkDropIntent =
  (typeof LINK_DROP_INTENT)[keyof typeof LINK_DROP_INTENT];

// 卡片内支持的语义投放区域
export const CARD_DROP_REGION = {
  BEFORE: "before",
  CENTER: "center",
  AFTER: "after",
} as const;

// 固定尺寸投放目标无需在拖拽期间重复监听尺寸变化
export const STATIC_DROPPABLE_RESIZE_OBSERVER_CONFIG = {
  disabled: true,
} as const;

// 页面支持的投放目标类型
export const DROP_TARGET_TYPE = {
  TRASH: "trash",
  LINK_CARD: "link-card",
  FOLDER_CARD: "folder-card",
  FOLDER_CONTENT: "folder-content",
  LINK_PREVIEW: "link-preview",
  DOCK_LINK: "dock-link",
  CATEGORY: "category",
  GRID_SLOT: "grid-slot",
  CATEGORY_GRID: "category-grid",
  LINK_LIST_END: "link-list-end",
  LINK_LIST: "link-list",
  DOCK_AREA: "dock-area",
} as const;

// 页面投放目标类型
export type DropTargetType =
  (typeof DROP_TARGET_TYPE)[keyof typeof DROP_TARGET_TYPE];

// 不同投放目标的碰撞优先级
export const DROP_TARGET_PRIORITY_BY_TYPE: Record<DropTargetType, number> = {
  [DROP_TARGET_TYPE.TRASH]: 100,
  [DROP_TARGET_TYPE.FOLDER_CONTENT]: 85,
  [DROP_TARGET_TYPE.LINK_CARD]: 80,
  [DROP_TARGET_TYPE.FOLDER_CARD]: 80,
  [DROP_TARGET_TYPE.LINK_PREVIEW]: 75,
  [DROP_TARGET_TYPE.DOCK_LINK]: 75,
  [DROP_TARGET_TYPE.CATEGORY]: 60,
  [DROP_TARGET_TYPE.GRID_SLOT]: 50,
  [DROP_TARGET_TYPE.LINK_LIST_END]: 40,
  [DROP_TARGET_TYPE.CATEGORY_GRID]: 20,
  [DROP_TARGET_TYPE.LINK_LIST]: 20,
  [DROP_TARGET_TYPE.DOCK_AREA]: 20,
};

// 分类拖拽会话数据
export interface CategoryDragItem {
  type: typeof DRAG_ITEM_TYPE.CATEGORY;
  id: string;
  categoryName: string;
  categoryIcon: string;
  previewWidth: number;
  previewHeight: number;
  index: number;
  originalIndex: number;
}

// 网址拖拽会话数据
export interface LinkDragItem {
  type: typeof DRAG_ITEM_TYPE.LINK;
  link: Link;
  previewWidth: number;
  previewHeight: number;
  sourceParentId: string;
  currentParentId: string;
  index: number;
  originalIndex: number;
  dropIntent: LinkDropIntent;
  mergeTargetLinkId?: string;
  targetLinkGroupId?: string;
}

// 文件夹拖拽会话数据
export interface LinkGroupDragItem {
  type: typeof DRAG_ITEM_TYPE.LINK_GROUP;
  id: string;
  linkGroup: LinkGroupInfo;
  previewWidth: number;
  previewHeight: number;
  index: number;
  targetIndex: number;
}

// Dock 网址拖拽会话数据
export interface DockLinkDragItem {
  type: typeof DRAG_ITEM_TYPE.DOCK_LINK;
  link: Link;
  index: number;
  targetIndex: number;
}

// 可由页面垃圾桶删除的拖拽项目
export type PageDragItem =
  | CategoryDragItem
  | LinkDragItem
  | LinkGroupDragItem;

// 页面统一拖拽会话数据
export type DragItem = PageDragItem | DockLinkDragItem;

// 投放目标处理拖拽移动时的坐标上下文
export interface DragMoveContext {
  coordinates: { x: number; y: number };
  targetRect: ClientRect;
}

// dnd-kit 拖拽源携带的页面数据
export interface DndSourceData {
  itemType: DragItemType;
  createDragItem: () => DragItem;
  onCancel?: () => void;
}

// dnd-kit 投放目标携带的页面数据
export interface DndTargetData {
  type: DropTargetType;
  accepts: readonly DragItemType[];
  scopeId?: string;
  priority?: number;
  getDragMoveKey?: (item: DragItem, context: DragMoveContext) => string;
  onDragMove?: (item: DragItem, context: DragMoveContext) => void;
  onDrop: (item: DragItem, context: DragMoveContext) => void;
}

/** 判断指针是否位于网址或文件夹卡片的中心投放区域。 */
export function isCardCenterDropRegion(context: DragMoveContext): boolean {
  // 指针在卡片内的横向比例
  const horizontalRatio =
    (context.coordinates.x - context.targetRect.left) /
    context.targetRect.width;
  // 指针在卡片内的纵向比例
  const verticalRatio =
    (context.coordinates.y - context.targetRect.top) /
    context.targetRect.height;
  return (
    horizontalRatio >= 0.25 &&
    horizontalRatio <= 0.75 &&
    verticalRatio >= 0.2 &&
    verticalRatio <= 0.8
  );
}

/** 按指针所在的卡片左右半区返回排序投放区域。 */
export function getHorizontalDropRegion(
  context: DragMoveContext
): typeof CARD_DROP_REGION.BEFORE | typeof CARD_DROP_REGION.AFTER {
  // 指针在卡片内的横向比例
  const horizontalRatio =
    (context.coordinates.x - context.targetRect.left) /
    context.targetRect.width;
  return horizontalRatio < 0.5
    ? CARD_DROP_REGION.BEFORE
    : CARD_DROP_REGION.AFTER;
}

/** 创建跨组件保持唯一的拖拽标识。 */
export function createDndId(namespace: string, ...parts: Array<string | number>) {
  return [namespace, ...parts].join(":");
}

/** 判断未知数据是否为页面拖拽源数据。 */
export function isDndSourceData(data: unknown): data is DndSourceData {
  if (!data || typeof data !== "object") {
    return false;
  }
  // 待判断的拖拽源记录
  const sourceData = data as Partial<DndSourceData>;
  return (
    typeof sourceData.itemType === "string" &&
    typeof sourceData.createDragItem === "function"
  );
}

/** 判断未知数据是否为页面投放目标数据。 */
export function isDndTargetData(data: unknown): data is DndTargetData {
  if (!data || typeof data !== "object") {
    return false;
  }
  // 待判断的投放目标记录
  const targetData = data as Partial<DndTargetData>;
  return (
    typeof targetData.type === "string" &&
    Array.isArray(targetData.accepts) &&
    typeof targetData.onDrop === "function"
  );
}
