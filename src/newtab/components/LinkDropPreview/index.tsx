import { useDroppable } from "@dnd-kit/core";
import LinkItem from "@/newtab/components/LinkItem";
import {
  DRAG_ITEM_TYPE,
  DROP_TARGET_TYPE,
  LINK_DROP_INTENT,
  STATIC_DROPPABLE_RESIZE_OBSERVER_CONFIG,
  createDndId,
  type DndTargetData,
  type LinkDragItem,
} from "@/newtab/drag-and-drop";
import type { Link } from "@/type/db";

interface LinkDropPreviewProps {
  link: Link;
  index: number;
  scopeId: string;
  onHover: (item: LinkDragItem, targetIndex: number) => void;
  onDrop: (item: LinkDragItem, targetIndex: number) => void;
}

/** 渲染网址跨父级移动时的原卡片落点预览。 */
export default function LinkDropPreview({
  link,
  index,
  scopeId,
  onHover,
  onDrop,
}: LinkDropPreviewProps) {
  // 原卡片预览携带的投放目标数据
  const targetData: DndTargetData = {
    type: DROP_TARGET_TYPE.LINK_PREVIEW,
    accepts: [DRAG_ITEM_TYPE.LINK],
    scopeId,
    priority: 90,
    /** 保持网址移动意图和当前预览索引一致。 */
    onDragMove(dragItem) {
      // 当前网址拖拽数据
      const item = dragItem as LinkDragItem;
      item.dropIntent = LINK_DROP_INTENT.MOVE;
      item.mergeTargetLinkId = undefined;
      item.targetLinkGroupId = undefined;
      onHover(item, index);
    },
    /** 将网址保存到原卡片预览对应的位置。 */
    onDrop(dragItem) {
      // 当前网址拖拽数据
      const item = dragItem as LinkDragItem;
      onDrop(item, index);
    },
  };
  // 原卡片预览的投放连接器
  const { setNodeRef } = useDroppable({
    id: createDndId("link-preview", scopeId, link.id, index),
    data: targetData,
    resizeObserverConfig: STATIC_DROPPABLE_RESIZE_OBSERVER_CONFIG,
  });

  return (
    <div ref={setNodeRef} className="h-22">
      <div className="pointer-events-none opacity-50">
        <LinkItem link={link} variant="drag-placeholder" />
      </div>
    </div>
  );
}
