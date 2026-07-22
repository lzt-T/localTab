import { useCallback, useState, useEffect, useMemo } from "react";
import { useDrop } from "react-dnd";
import { Plus } from "lucide-react";
import type { Link } from "@/type/db";
import { cn } from "@/lib/utils";
import { DRAG_ITEM_TYPE, type LinkDragItem } from "@/newtab/drag-and-drop";
import LinkItemWrapper from "@/newtab/components/LinkList/LinkItemWrapper";

interface LinkListProps {
  categoryLinks: Link[];
  categoryId: string;
  handleEditClick: (linkId: string) => void;
  handleDeleteClick: (linkId: string) => void;
  handleSkipClick: (url: string) => void;
  onMoveLink: (
    linkId: string,
    targetCategoryId: string,
    targetIndex: number
  ) => Promise<void>;
  onCancelDrag: () => Promise<void>;
  onOpenAddLink: () => void;
}

export default function LinkList({
  categoryLinks,
  categoryId,
  handleEditClick,
  handleDeleteClick,
  handleSkipClick,
  onMoveLink,
  onCancelDrag,
  onOpenAddLink,
}: LinkListProps) {
  // 按 sort 字段排序的链接列表
  const sortedLinks = useMemo(() => {
    return [...categoryLinks].sort((a, b) => a.sort - b.sort);
  }, [categoryLinks]);

  // 本地状态用于拖拽时的 UI 更新
  const [localLinks, setLocalLinks] = useState<Link[]>(() => sortedLinks);

  // 当 categoryLinks 更新时同步本地状态
  useEffect(() => {
    setLocalLinks(sortedLinks);
  }, [sortedLinks]);

  /* 编辑链接 */
  const onEditClick = useCallback(
    (linkId: string) => {
      handleEditClick(linkId);
    },
    [handleEditClick]
  );

  /* 删除链接 */
  const onDeleteClick = useCallback(
    (linkId: string) => {
      handleDeleteClick(linkId);
    },
    [handleDeleteClick]
  );

  /* 跳转链接 */
  const onSkipClick = useCallback(
    (url: string) => {
      handleSkipClick(url);
    },
    [handleSkipClick]
  );

  /* 拖拽悬停时插入或移动预览卡片。 */
  const onHover = useCallback(
    (item: LinkDragItem, hoverIndex: number) => {
      setLocalLinks((previousLinks) => {
        const previousIndex = previousLinks.findIndex(
          (link) => link.id === item.link.id
        );
        const nextLinks = previousLinks.filter((link) => link.id !== item.link.id);
        const insertIndex = Math.max(0, Math.min(hoverIndex, nextLinks.length));
        if (
          item.currentCategoryId === categoryId &&
          previousIndex === insertIndex
        ) {
          return previousLinks;
        }

        const previewLink = { ...item.link, parentId: categoryId };
        nextLinks.splice(insertIndex, 0, previewLink);

        item.currentCategoryId = categoryId;
        item.index = insertIndex;
        return nextLinks;
      });
    },
    [categoryId]
  );

  /* 松开鼠标时提交预览中的最终分类和位置。 */
  const onDrop = useCallback(
    (item: LinkDragItem, targetIndex: number) => {
      void onMoveLink(item.link.id, categoryId, targetIndex);
    },
    [categoryId, onMoveLink]
  );

  const [{ isOverEnd }, dropAtEnd] = useDrop<
    LinkDragItem,
    void,
    { isOverEnd: boolean }
  >({
    accept: DRAG_ITEM_TYPE.LINK,
    hover(item) {
      onHover(item, localLinks.length);
    },
    drop(item) {
      onDrop(item, item.index);
    },
    collect: (monitor) => ({
      isOverEnd: monitor.isOver({ shallow: true }),
    }),
  });

  const addLinkRef = useCallback(
    (node: HTMLDivElement | null) => {
      dropAtEnd(node);
    },
    [dropAtEnd]
  );

  return (
    <>
      {localLinks.map((link, index) => {
        return (
          <LinkItemWrapper
            key={link.id}
            link={link}
            index={index}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            onSkipClick={onSkipClick}
            onHover={onHover}
            onDrop={onDrop}
            onCancelDrag={onCancelDrag}
          />
        );
      })}

      <div
        ref={addLinkRef}
        className={cn(
          "glass-style-border flex items-center justify-center rounded-2xl p-6 text-white/80 shadow-lg shadow-black/10 transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:bg-[rgba(68,70,74,0.66)] hover:border-white/20 hover:shadow-xl hover:shadow-black/20 cursor-pointer h-32",
          isOverEnd && "ring-2 ring-blue-200/80 bg-white/20"
        )}
        onClick={onOpenAddLink}
      >
        <Plus size={32} />
      </div>
    </>
  );
}
