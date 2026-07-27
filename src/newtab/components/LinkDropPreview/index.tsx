import { useCallback } from "react";
import { useDrop } from "react-dnd";
import LinkItem from "@/newtab/components/LinkItem";
import {
  DRAG_ITEM_TYPE,
  LINK_DROP_INTENT,
  type LinkDragItem,
} from "@/newtab/drag-and-drop";
import type { Link } from "@/type/db";

interface LinkDropPreviewProps {
  link: Link;
  index: number;
  onHover: (item: LinkDragItem, targetIndex: number) => void;
  onDrop: (item: LinkDragItem, targetIndex: number) => void;
}

/** 渲染网址跨父级移动时的原卡片落点预览。 */
export default function LinkDropPreview({
  link,
  index,
  onHover,
  onDrop,
}: LinkDropPreviewProps) {
  // 原卡片预览的投放连接器
  const [, dropLink] = useDrop<LinkDragItem, void>({
    accept: DRAG_ITEM_TYPE.LINK,
    /** 保持网址移动意图和当前预览索引一致。 */
    hover(item) {
      item.dropIntent = LINK_DROP_INTENT.MOVE;
      item.mergeTargetLinkId = undefined;
      item.targetLinkGroupId = undefined;
      onHover(item, index);
    },
    /** 将网址保存到原卡片预览对应的位置。 */
    drop(item) {
      onDrop(item, index);
    },
  });

  /** 连接原卡片预览与网址投放区域。 */
  const connectPreviewRef = useCallback(
    (node: HTMLDivElement | null) => {
      dropLink(node);
    },
    [dropLink]
  );

  return (
    <div ref={connectPreviewRef} className="h-22">
      <div className="pointer-events-none opacity-50">
        <LinkItem link={link} variant="drag-placeholder" />
      </div>
    </div>
  );
}
