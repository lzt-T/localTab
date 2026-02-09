import { useCallback, useState, useEffect, useMemo } from "react";
import type { Link } from "@/type/db";
import LinkItemWrapper from "./LinkItemWrapper";

interface LinkListProps {
  categoryLinks: Link[];
  currentCategoryId: string;
  handleEditClick: (linkId: string) => void;
  handleDeleteClick: (linkId: string) => void;
  handleSkipClick: (url: string) => void;
  onMoveLink: (parentId: string, dragIndex: number, hoverIndex: number) => void;
}

export default function LinkList({
  categoryLinks,
  currentCategoryId,
  handleEditClick,
  handleDeleteClick,
  handleSkipClick,
  onMoveLink,
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
          />
        );
      })}
    </>
  );
}
