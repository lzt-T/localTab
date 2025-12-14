import React, { useCallback, useState, useEffect, useMemo } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { link } from "@/type/db";
import LinkItem from "../LinkItem";
import { cn } from "@/lib/utils";

interface LinkListProps {
  categoryLinks: link[];
  currentCategoryId: string;
  handleEditClick: (linkId: string) => void;
  handleDeleteClick: (linkId: string) => Promise<void>;
  handleSkipClick: (url: string) => void;
  onMoveLink: (parentId: string, dragIndex: number, hoverIndex: number) => void;
}

interface LinkItemWrapperProps {
  link: link;
  index: number;
  onEditClick: (linkId: string) => void;
  onDeleteClick: (linkId: string) => Promise<void>;
  onSkipClick: (url: string) => void;
  onHover: (dragIndex: number, hoverIndex: number) => void;
  onDrop: (dragIndex: number, hoverIndex: number) => void;
}

const ITEM_TYPE = "link";

function LinkItemWrapper({
  link,
  index,
  onEditClick,
  onDeleteClick,
  onSkipClick,
  onHover,
  onDrop,
}: LinkItemWrapperProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => ({ index, id: link.id, originalIndex: index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (_item, monitor) => {
      // 如果拖拽被取消或没有成功放置，不执行任何操作
      if (!monitor.didDrop()) {
        return;
      }
    },
  });

  const [{ handlerId }, drop] = useDrop<
    { index: number; id: string; originalIndex: number },
    void,
    { handlerId: string | symbol | null }
  >({
    accept: ITEM_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number; id: string; originalIndex: number }) {
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      // 只更新 UI，不更新数据库
      onHover(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    drop(item: { index: number; id: string; originalIndex: number }) {
      // 使用当前的 index（经过 hover 调整后的位置）作为最终位置
      const finalIndex = index;
      const originalIndex = item.originalIndex;

      // 如果位置发生了变化，更新数据库
      if (originalIndex !== finalIndex) {
        onDrop(originalIndex, finalIndex);
      }
    },
  });

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      drag(drop(node));
    },
    [drag, drop]
  );

  return (
    <div
      ref={ref}
      className={cn(
        "transition-opacity",
        isDragging ? "opacity-50" : "opacity-100"
      )}
      data-handler-id={handlerId}
    >
      <LinkItem
        link={link}
        handleEditClick={onEditClick}
        handleDeleteClick={onDeleteClick}
        handleSkipClick={onSkipClick}
      />
    </div>
  );
}

const LinkList: React.FC<LinkListProps> = ({
  categoryLinks,
  currentCategoryId,
  handleEditClick,
  handleDeleteClick,
  handleSkipClick,
  onMoveLink,
}) => {
  // 按 sort 字段排序的链接列表
  const sortedLinks = useMemo(() => {
    return [...categoryLinks].sort((a, b) => a.sort - b.sort);
  }, [categoryLinks]);

  // 本地状态用于拖拽时的 UI 更新
  const [localLinks, setLocalLinks] = useState<link[]>(() => sortedLinks);

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
    async (linkId: string) => {
      await handleDeleteClick(linkId);
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

  /* 拖拽悬停时更新本地 UI */
  const onHover = useCallback((dragIndex: number, hoverIndex: number) => {
    setLocalLinks((prev) => {
      const newLinks = [...prev];
      const draggedLink = newLinks[dragIndex];
      newLinks.splice(dragIndex, 1);
      newLinks.splice(hoverIndex, 0, draggedLink);
      return newLinks;
    });
  }, []);

  /* 松开鼠标时更新数据库 */
  const onDrop = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      await onMoveLink(currentCategoryId, dragIndex, hoverIndex);
    },
    [onMoveLink, currentCategoryId]
  );

  return (
    <>
      {localLinks.map((link, index) => (
        <LinkItemWrapper
          key={link.id}
          link={link}
          index={index}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
          onSkipClick={onSkipClick}
          onHover={onHover}
          onDrop={onDrop}
        />
      ))}
    </>
  );
};

export default LinkList;
