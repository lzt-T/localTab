import { memo } from "react";
import { useDragLayer } from "react-dnd";
import LinkItem from "@/newtab/components/LinkItem";
import {
  DRAG_ITEM_TYPE,
  type DragItem,
} from "@/newtab/drag-and-drop";
import type { Link } from "@/type/db";

interface DragPreviewCardProps {
  link: Link;
}

/** 渲染无需随拖拽坐标重复更新的静态网址预览。 */
function DragPreviewCard({ link }: DragPreviewCardProps) {
  return <LinkItem link={link} variant="drag-preview" />;
}

// 仅在被拖网址变化时重新渲染预览卡片内容
const MemoizedDragPreviewCard = memo(DragPreviewCard);

/** 渲染跟随指针移动的网址拖拽预览层。 */
export default function LinkDragPreview() {
  // 当前网址拖拽预览所需的项目与屏幕位置
  const { item, isDragging, sourceOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem<DragItem | null>(),
    isDragging: monitor.isDragging(),
    sourceOffset: monitor.getSourceClientOffset(),
  }));

  if (
    !isDragging ||
    !sourceOffset ||
    !item ||
    item.type !== DRAG_ITEM_TYPE.LINK
  ) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div
        className="will-change-transform"
        style={{
          width: item.previewWidth,
          height: item.previewHeight,
          transform: `translate3d(${sourceOffset.x}px, ${sourceOffset.y}px, 0)`,
        }}
      >
        <MemoizedDragPreviewCard link={item.link} />
      </div>
    </div>
  );
}
