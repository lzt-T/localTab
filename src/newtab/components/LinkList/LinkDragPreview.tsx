import { useDragLayer } from "react-dnd";
import LinkItem from "@/newtab/components/LinkItem";
import {
  DRAG_ITEM_TYPE,
  type DragItem,
} from "@/newtab/drag-and-drop";

export default function LinkDragPreview() {
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
        style={{
          width: item.previewWidth,
          height: item.previewHeight,
          transform: `translate3d(${sourceOffset.x}px, ${sourceOffset.y}px, 0)`,
        }}
      >
        <LinkItem link={item.link} />
      </div>
    </div>
  );
}
