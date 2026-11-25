import { memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import CategoryGrid from "@/newtab/components/CategoryGrid";
import { cn } from "@/lib/utils";
import type { CategoryInfo, LinkGroupInfo } from "@/type/db";

interface CategoryPageProps {
  categoryInfo: CategoryInfo;
  isActive: boolean;
  scrollTriggerToken: number;
  shouldIgnoreIntersection: () => boolean;
  onProgrammaticScrollSettled: (categoryId: string) => void;
  onOpenEditLink: (linkId: string) => void;
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
  onOpenBookmarkImport: () => void;
  onRenameLinkGroup: (linkGroupId: string, name: string) => Promise<void>;
  onDeleteLinkGroup: (linkGroup: LinkGroupInfo) => void;
  handleCategoryChange: (categoryId: string) => void;
}

/** 渲染单个分类及其保留滚动位置的可滚动卡片网格。 */
function CategoryPage({
  categoryInfo,
  isActive,
  scrollTriggerToken,
  shouldIgnoreIntersection,
  onProgrammaticScrollSettled,
  onOpenEditLink,
  moveLink,
  mergeLinks,
  moveCategoryItem,
  onCancelLinkDrag,
  onOpenAddLink,
  onOpenBookmarkImport,
  onRenameLinkGroup,
  onDeleteLinkGroup,
  handleCategoryChange,
}: CategoryPageProps) {
  // 分类页操作的本地化文案
  const { t } = useTranslation();
  // 分类整页元素引用
  const categoryPageRef = useRef<HTMLDivElement>(null);
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

    // 分类页面可见性观察器（不重置内部网格滚动位置，保留上下文）
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当前分类页面是否达到可见阈值
          const isCategoryPageVisible = entry.intersectionRatio >= 0.5;
          isCategoryPageVisibleRef.current = isCategoryPageVisible;
          if (!isCategoryPageVisible) {
            return;
          }
          onProgrammaticScrollSettled(categoryInfo.id);
          if (!shouldIgnoreIntersection()) {
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
  }, [
    categoryInfo.id,
    handleCategoryChange,
    onProgrammaticScrollSettled,
    shouldIgnoreIntersection,
  ]);

  useEffect(() => {
    if (!categoryPageRef.current) {
      return;
    }
    if (isActive && !isCategoryPageVisibleRef.current) {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      categoryPageRef.current.scrollIntoView({
        behavior: prefersReducedMotion || scrollTriggerToken === 0 ? "auto" : "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  }, [isActive, scrollTriggerToken]);

  return (
    <div
      ref={categoryPageRef}
      className={cn(
        "relative z-[1] flex h-screen w-full snap-start flex-col pt-36 md:pl-[232px] md:pr-8 md:pt-32 xl:px-[232px]",
        !isActive && "[content-visibility:auto] [contain-intrinsic-size:auto_100vh]"
      )}
    >
      <section className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col px-4 pb-24 sm:px-6 md:px-4 md:pb-28">
        <header className="mb-4 flex shrink-0 items-center gap-2 px-1 text-[var(--surface-text-secondary)]">
          <h1 className="truncate text-base font-semibold tracking-[-0.015em] text-[var(--surface-text)] [text-shadow:var(--surface-heading-shadow)]">
            {categoryInfo.name}
          </h1>
          <span
            className="size-1 rounded-full bg-[var(--surface-text-subtle)]"
            aria-hidden="true"
          />
          <p className="truncate text-xs font-medium text-[var(--surface-text-muted)] [text-shadow:var(--surface-heading-shadow)]">
            {t("workspace.websiteCount", { count: linkCount })}
          </p>
        </header>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-1 pt-1">
          <div className="h-full pb-8">
            <CategoryGrid
              categoryInfo={categoryInfo}
              isDndEnabled={isActive}
              onOpenEditLink={onOpenEditLink}
              onMoveLink={moveLink}
              onMergeLinks={mergeLinks}
              onMoveCategoryItem={moveCategoryItem}
              onCancelLinkDrag={onCancelLinkDrag}
              onOpenAddLink={onOpenAddLink}
              onOpenBookmarkImport={onOpenBookmarkImport}
              onRenameFolder={onRenameLinkGroup}
              onDeleteFolder={onDeleteLinkGroup}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default memo(CategoryPage);
