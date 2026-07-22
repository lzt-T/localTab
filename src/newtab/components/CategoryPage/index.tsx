import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import LinkList from "@/newtab/components/LinkList";
import type { CategoryInfo } from "@/type/db";

interface CategoryPageProps {
  categoryInfo: CategoryInfo;
  currentCategoryId: string;
  onOpenEditLink: (linkId: string) => void;
  onDeleteLinkClick: (linkId: string) => void;
  handleSkipClick: (url: string) => void;
  moveLink: (
    linkId: string,
    targetCategoryId: string,
    targetIndex: number
  ) => Promise<void>;
  onCancelLinkDrag: () => Promise<void>;
  onOpenAddLink: () => void;
  handleCategoryChange: (categoryId: string) => void;
}

export default function CategoryPage(props: CategoryPageProps) {
  const {
    categoryInfo,
    currentCategoryId,
    onOpenEditLink,
    onDeleteLinkClick,
    handleSkipClick,
    moveLink,
    onCancelLinkDrag,
    onOpenAddLink,
    handleCategoryChange,
  } = props;

  const categoryPageRef = useRef<HTMLDivElement>(null);
  const linkListRef = useRef<HTMLDivElement>(null);
  const isCategoryPageVisibleRef = useRef(false);

  useEffect(() => {
    if (!categoryPageRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
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
      className="flex flex-col w-full h-screen snap-start items-center"
    >
      <div className="h-[160px] flex items-center justify-center"></div>

      <section className="flex-1 w-[calc(100%-376px)] p-8 min-h-0">
        <div
          ref={linkListRef}
          className={cn(
            "h-full overflow-y-auto pt-2 px-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6 content-start"
          )}
        >
          <LinkList
            categoryLinks={categoryInfo.links}
            categoryId={categoryInfo.id}
            handleEditClick={onOpenEditLink}
            handleDeleteClick={onDeleteLinkClick}
            handleSkipClick={handleSkipClick}
            onMoveLink={moveLink}
            onCancelDrag={onCancelLinkDrag}
            onOpenAddLink={onOpenAddLink}
          />
        </div>
      </section>
    </div>
  );
}
