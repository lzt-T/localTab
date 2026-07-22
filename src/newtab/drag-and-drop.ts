import type { Link } from "@/type/db";

export const DRAG_ITEM_TYPE = {
  CATEGORY: "category",
  LINK: "link",
} as const;

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
  sourceCategoryId: string;
  currentCategoryId: string;
  index: number;
  originalIndex: number;
}

export type DragItem = CategoryDragItem | LinkDragItem;
