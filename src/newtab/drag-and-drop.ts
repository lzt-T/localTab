import type { Link, LinkGroupInfo } from "@/type/db";

// 页面支持的拖拽项目类型
export const DRAG_ITEM_TYPE = {
  CATEGORY: "category",
  LINK: "link",
  LINK_GROUP: "link-group",
} as const;

// 网址卡片的投放意图
export const LINK_DROP_INTENT = {
  MOVE: "move",
  MERGE: "merge",
} as const;

// 网址卡片投放意图类型
export type LinkDropIntent =
  (typeof LINK_DROP_INTENT)[keyof typeof LINK_DROP_INTENT];

export interface CategoryDragItem {
  type: typeof DRAG_ITEM_TYPE.CATEGORY;
  id: string;
  index: number;
  originalIndex: number;
}

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

export interface LinkGroupDragItem {
  type: typeof DRAG_ITEM_TYPE.LINK_GROUP;
  id: string;
  linkGroup: LinkGroupInfo;
  previewWidth: number;
  previewHeight: number;
  index: number;
  targetIndex: number;
}

export type PageDragItem =
  | CategoryDragItem
  | LinkDragItem
  | LinkGroupDragItem;

export type DragItem = PageDragItem;
