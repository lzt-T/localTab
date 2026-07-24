import { useEffect, useRef } from "react";
import CategoryGrid from "@/newtab/components/CategoryGrid";
import type { CategoryInfo, LinkGroupInfo } from "@/type/db";

interface CategoryPageProps {
  categoryInfo: CategoryInfo;
  currentCategoryId: string;
  onOpenEditLink: (linkId: string) => void;
  onDeleteLinkClick: (linkId: string) => void;
  handleSkipClick: (url: string) => void;
  moveLink: (
    linkId: string,
    targetParentId: string,
    targetIndex: number
  ) => Promise<void>;
  mergeLinks: (
    categoryId: string,
    targetLinkId: string,
    draggedLinkId: string
  ) => Promise<void>;
  moveCategoryItem: (
    categoryId: string,
    itemId: string,
    targetIndex: number
  ) => Promise<void>;
  onCancelLinkDrag: () => Promise<void>;
  onOpenAddLink: (parentId: string) => void;
  onEditLinkGroup: (linkGroup: LinkGroupInfo) => void;
  onDeleteLinkGroup: (linkGroup: LinkGroupInfo) => void;
  handleCategoryChange: (categoryId: string) => void;
}

/** 渲染单个分类及其可滚动的统一卡片网格。 */
export default function CategoryPage({
  categoryInfo,
  currentCategoryId,
  onOpenEditLink,
  onDeleteLinkClick,
  handleSkipClick,
  moveLink,
  mergeLinks,
  moveCategoryItem,
  onCancelLinkDrag,
  onOpenAddLink,
  onEditLinkGroup,
  onDeleteLinkGroup,
  handleCategoryChange,
}: CategoryPageProps) {
  // 分类整页元素引用
  const categoryPageRef = useRef<HTMLDivElement>(null);
  // 分类内容滚动区域引用
  const linkListRef = useRef<HTMLDivElement>(null);
  // 分类页面当前是否可见
  const isCategoryPageVisibleRef = useRef(false);

  useEffect(() => {
    if (!categoryPageRef.current) {
      return;
    }

    // 分类页面可见性观察器
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当前分类页面是否达到可见阈值
          const isCategoryPageVisible = entry.intersectionRatio >= 0.5;
          isCategoryPageVisibleRef.current = isCategoryPageVisible;
          if (isCategoryPageVisible) {
            linkListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            handleCategoryChange(categoryInfo.id);
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(categoryPageRef.current);
    return () => {
      observer.disconnect();
    };
  }, [categoryInfo.id, handleCategoryChange]);

  useEffect(() => {
    if (!categoryPageRef.current) {
      return;
    }
    if (
      currentCategoryId === categoryInfo.id &&
      !isCategoryPageVisibleRef.current
    ) {
      categoryPageRef.current.scrollIntoView({
        behavior: "auto",
        block: "start",
        inline: "nearest",
      });
    }
  }, [categoryInfo.id, currentCategoryId]);

  return (
    <div
      ref={categoryPageRef}
      className="flex h-screen w-full snap-start flex-col items-center"
    >
      <div className="flex h-[128px] items-center justify-center" />
      <section className="min-h-0 w-[calc(100%-424px)] flex-1 p-8">
        <div
          ref={linkListRef}
          className="h-full overflow-x-hidden overflow-y-auto px-2 pt-2"
        >
          <div className="pb-8">
            <CategoryGrid
              categoryInfo={categoryInfo}
              onOpenEditLink={onOpenEditLink}
              onDeleteLink={onDeleteLinkClick}
              onSkipLink={handleSkipClick}
              onMoveLink={moveLink}
              onMergeLinks={mergeLinks}
              onMoveCategoryItem={moveCategoryItem}
              onCancelLinkDrag={onCancelLinkDrag}
              onOpenAddLink={onOpenAddLink}
              onEditFolder={onEditLinkGroup}
              onDeleteFolder={onDeleteLinkGroup}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
