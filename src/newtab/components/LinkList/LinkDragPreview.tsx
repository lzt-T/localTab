import { memo, type ReactNode } from "react";
import DockLinkIcon from "@/newtab/components/Dock/DockLinkIcon";
import Icon from "@/newtab/components/Icon";
import LinkFolderCardContent from "@/newtab/components/LinkFolderCard/LinkFolderCardContent";
import LinkItem from "@/newtab/components/LinkItem";
import {
  DRAG_ITEM_TYPE,
  type CategoryDragItem,
  type DockLinkDragItem,
  type DragItem,
  type LinkDragItem,
  type LinkGroupDragItem,
} from "@/newtab/drag-and-drop";
import type { Link, LinkGroupInfo } from "@/type/db";

interface LinkDragPreviewProps {
  item: DragItem;
}

interface CategoryDragPreviewCardProps {
  name: string;
  icon: string;
}

interface LinkDragPreviewCardProps {
  link: Link;
}

interface LinkGroupDragPreviewCardProps {
  linkGroup: LinkGroupInfo;
}

interface DragPreviewLayout {
  width: number;
  height: number;
  content: ReactNode;
}

// 单类拖拽项目对应的预览布局创建器
type DragPreviewStrategy = (item: DragItem) => DragPreviewLayout;

/** 渲染与来源尺寸一致的静态分类行预览。 */
function CategoryDragPreviewCard({
  name,
  icon,
}: CategoryDragPreviewCardProps) {
  return (
    <div className="flex h-full w-full items-center gap-1.5 rounded-xl border border-white/20 border-t-white/25 bg-[rgba(58,60,64,0.92)] px-3 text-white">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-blue-100">
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">
        {name}
      </span>
    </div>
  );
}

// 仅在被拖分类变化时重新渲染预览行内容
const MemoizedCategoryDragPreviewCard = memo(CategoryDragPreviewCard);

/** 渲染无需随拖拽坐标重复更新的静态网址预览。 */
function LinkDragPreviewCard({ link }: LinkDragPreviewCardProps) {
  return <LinkItem link={link} variant="drag-preview" />;
}

// 仅在被拖网址变化时重新渲染预览卡片内容
const MemoizedLinkDragPreviewCard = memo(LinkDragPreviewCard);

/** 渲染无需随拖拽坐标重复更新的静态文件夹预览。 */
function LinkGroupDragPreviewCard({
  linkGroup,
}: LinkGroupDragPreviewCardProps) {
  return (
    <div className="group/folder relative flex h-22 w-full flex-col items-center justify-center gap-1 rounded-xl border border-white/20 border-t-white/25 bg-[rgba(58,60,64,0.92)] p-2 text-white">
      <LinkFolderCardContent linkGroup={linkGroup} />
    </div>
  );
}

// 仅在被拖文件夹变化时重新渲染预览卡片内容
const MemoizedLinkGroupDragPreviewCard = memo(LinkGroupDragPreviewCard);

/** 创建分类行的拖拽预览布局。 */
function createCategoryDragPreview(item: DragItem): DragPreviewLayout {
  // 当前分类拖拽数据
  const categoryItem = item as CategoryDragItem;
  return {
    width: categoryItem.previewWidth,
    height: categoryItem.previewHeight,
    content: (
      <MemoizedCategoryDragPreviewCard
        name={categoryItem.categoryName}
        icon={categoryItem.categoryIcon}
      />
    ),
  };
}

/** 创建网址卡片的拖拽预览布局。 */
function createLinkDragPreview(item: DragItem): DragPreviewLayout {
  // 当前网址拖拽数据
  const linkItem = item as LinkDragItem;
  return {
    width: linkItem.previewWidth,
    height: linkItem.previewHeight,
    content: <MemoizedLinkDragPreviewCard link={linkItem.link} />,
  };
}

/** 创建文件夹卡片的拖拽预览布局。 */
function createLinkGroupDragPreview(item: DragItem): DragPreviewLayout {
  // 当前文件夹拖拽数据
  const linkGroupItem = item as LinkGroupDragItem;
  return {
    width: linkGroupItem.previewWidth,
    height: linkGroupItem.previewHeight,
    content: (
      <MemoizedLinkGroupDragPreviewCard linkGroup={linkGroupItem.linkGroup} />
    ),
  };
}

/** 创建 Dock 网址的拖拽预览布局。 */
function createDockLinkDragPreview(item: DragItem): DragPreviewLayout {
  // 当前 Dock 网址拖拽数据
  const dockLinkItem = item as DockLinkDragItem;
  return {
    width: 44,
    height: 44,
    content: (
      <div className="flex size-11 items-center justify-center rounded-xl border border-white/20 bg-[rgba(58,60,64,0.94)] text-white shadow-lg shadow-black/30">
        <DockLinkIcon link={dockLinkItem.link} />
      </div>
    ),
  };
}

// 不同拖拽项目对应的预览布局策略
const DRAG_PREVIEW_STRATEGY_BY_TYPE: Record<
  DragItem["type"],
  DragPreviewStrategy
> = {
  [DRAG_ITEM_TYPE.CATEGORY]: createCategoryDragPreview,
  [DRAG_ITEM_TYPE.LINK]: createLinkDragPreview,
  [DRAG_ITEM_TYPE.LINK_GROUP]: createLinkGroupDragPreview,
  [DRAG_ITEM_TYPE.DOCK_LINK]: createDockLinkDragPreview,
};

/** 渲染由 dnd-kit DragOverlay 定位的页面拖拽预览。 */
export default function LinkDragPreview({ item }: LinkDragPreviewProps) {
  // 当前拖拽类型对应的预览策略
  const createDragPreview = DRAG_PREVIEW_STRATEGY_BY_TYPE[item.type];
  // 当前拖拽项目的预览布局
  const dragPreview = createDragPreview(item);
  return (
    <div
      className="will-change-transform"
      style={{ width: dragPreview.width, height: dragPreview.height }}
    >
      <div className="h-full w-full origin-center scale-95 rotate-1 rounded-xl opacity-90 shadow-[0_18px_42px_rgba(0,0,0,0.38)] transform-gpu motion-reduce:transform-none">
        {dragPreview.content}
      </div>
    </div>
  );
}
