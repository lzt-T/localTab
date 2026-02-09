import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import LinkList from "../LinkList";
import { Plus } from "lucide-react";
import type { CategoryInfo } from "@/type/db";

interface CategoryPageProps {
  categoryInfo: CategoryInfo;
  currentCategoryId: string;
  onOpenEditLink: (linkId: string) => void;
  onDeleteLinkClick: (linkId: string) => void;
  handleSkipClick: (url: string) => void;
  updateLinkOrder: (
    parentId: string,
    dragIndex: number,
    hoverIndex: number
  ) => void;
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
    updateLinkOrder,
    onOpenAddLink,
    handleCategoryChange,
  } = props;

  const linkListRef = useRef<HTMLDivElement>(null);
  const isEnter = useRef(false);

  useEffect(() => {
    if (!linkListRef.current) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          linkListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          handleCategoryChange(categoryInfo.id);
          isEnter.current = true;
        } else {
          isEnter.current = false;
        }
      });
    });
    observer.observe(linkListRef.current as unknown as Element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!linkListRef.current) {
      return;
    }

    if (currentCategoryId === categoryInfo.id && !isEnter.current) {
      /* 滚动到页面中间 */
      linkListRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  }, [currentCategoryId]);

  return (
    <div className="flex flex-col w-full h-screen snap-start items-center">
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
            currentCategoryId={currentCategoryId}
            handleEditClick={onOpenEditLink}
            handleDeleteClick={onDeleteLinkClick}
            handleSkipClick={handleSkipClick}
            onMoveLink={updateLinkOrder}
          />

          {/* 添加按钮 */}
          <div
            className="glass-style-border flex items-center justify-center rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl  hover:-translate-y-2 cursor-pointer h-32"
            onClick={onOpenAddLink}
          >
            <Plus size={32} />
          </div>
        </div>
      </section>
    </div>
  );
}
