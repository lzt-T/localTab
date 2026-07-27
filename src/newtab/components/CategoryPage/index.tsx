import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import CategoryGrid from "@/newtab/components/CategoryGrid";
import type { CategoryInfo, LinkGroupInfo } from "@/type/db";

interface CategoryPageProps {
  categoryInfo: CategoryInfo;
  currentCategoryId: string;
  onOpenEditLink: (linkId: string) => void;
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
  handleCategoryChange: (categoryId: string) => void;
}

/** 渲染单个分类及其可滚动的统一卡片网格。 */
export default function CategoryPage({
  categoryInfo,
  currentCategoryId,
  onOpenEditLink,
  handleSkipClick,
  moveLink,
  mergeLinks,
  moveCategoryItem,
  onCancelLinkDrag,
  onOpenAddLink,
  onEditLinkGroup,
  handleCategoryChange,
}: CategoryPageProps) {
  // 分类页操作的本地化文案
  const { t } = useTranslation();
  // 分类整页元素引用
  const categoryPageRef = useRef<HTMLDivElement>(null);
  // 分类内容滚动区域引用
  const linkListRef = useRef<HTMLDivElement>(null);
  // 分类页面当前是否可见
  const isCategoryPageVisibleRef = useRef(false);
  // 分类内包含文件夹子项的全部网址数量
  const linkCount =
    categoryInfo.links.length +
    categoryInfo.linkGroups.reduce(
      (totalCount, linkGroup) => totalCount + linkGroup.links.length,
      0
    );

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
      className="relative z-[1] flex h-screen w-full snap-start flex-col pt-36 md:px-44 md:pt-32"
    >
      <section className="mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 flex-col px-4 pb-4 sm:px-6 md:px-4 md:pb-6">
        <header className="mb-4 flex shrink-0 items-center gap-2 px-1 text-white/70">
          <h1 className="truncate text-base font-semibold tracking-[-0.015em] text-white/90">
            {categoryInfo.name}
          </h1>
          <span className="size-1 rounded-full bg-white/35" aria-hidden="true" />
          <p className="truncate text-xs font-medium text-white/50">
            {t("workspace.websiteCount", { count: linkCount })}
          </p>
        </header>
        <div
          ref={linkListRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-1 pb-24 pt-1 md:pb-28"
        >
          <div className="pb-8">
            <CategoryGrid
              categoryInfo={categoryInfo}
              onOpenEditLink={onOpenEditLink}
              onSkipLink={handleSkipClick}
              onMoveLink={moveLink}
              onMergeLinks={mergeLinks}
              onMoveCategoryItem={moveCategoryItem}
              onCancelLinkDrag={onCancelLinkDrag}
              onOpenAddLink={onOpenAddLink}
              onEditFolder={onEditLinkGroup}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
