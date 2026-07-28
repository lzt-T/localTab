import { memo, type ReactNode } from "react";
import { useDragLayer } from "react-dnd";
import LinkFolderCardContent from "@/newtab/components/LinkFolderCard/LinkFolderCardContent";
import LinkItem from "@/newtab/components/LinkItem";
import {
  DRAG_ITEM_TYPE,
  type DragItem,
  type LinkDragItem,
  type LinkGroupDragItem,
} from "@/newtab/drag-and-drop";
import type { Link, LinkGroupInfo } from "@/type/db";

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

type DragPreviewStrategy = (item: DragItem) => DragPreviewLayout;

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

// 不同拖拽项目对应的预览布局策略
const DRAG_PREVIEW_STRATEGY_BY_TYPE: Partial<
  Record<DragItem["type"], DragPreviewStrategy>
> = {
  [DRAG_ITEM_TYPE.LINK]: createLinkDragPreview,
  [DRAG_ITEM_TYPE.LINK_GROUP]: createLinkGroupDragPreview,
};

/** 渲染跟随指针移动的页面拖拽预览层。 */
export default function LinkDragPreview() {
  // 当前卡片拖拽预览所需的项目与屏幕位置
  const { item, isDragging, sourceOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem<DragItem | null>(),
    isDragging: monitor.isDragging(),
    sourceOffset: monitor.getSourceClientOffset(),
  }));

  if (!isDragging || !sourceOffset || !item) {
    return null;
  }

  // 当前拖拽类型对应的预览策略
  const createDragPreview = DRAG_PREVIEW_STRATEGY_BY_TYPE[item.type];
  if (!createDragPreview) {
    return null;
  }

  // 当前拖拽卡片的预览布局
  const dragPreview = createDragPreview(item);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div
        className="will-change-transform"
        style={{
          width: dragPreview.width,
          height: dragPreview.height,
          transform: `translate3d(${sourceOffset.x}px, ${sourceOffset.y}px, 0)`,
        }}
      >
        <div className="h-full w-full origin-center scale-95 rotate-1 rounded-xl opacity-90 shadow-[0_18px_42px_rgba(0,0,0,0.38)] transform-gpu motion-reduce:transform-none">
          {dragPreview.content}
        </div>
      </div>
    </div>
  );
}
