import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDrop } from "react-dnd";
import { Plus } from "lucide-react";
import type { Link } from "@/type/db";
import { cn } from "@/lib/utils";
import {
  DRAG_ITEM_TYPE,
  LINK_DROP_INTENT,
  type LinkDragItem,
} from "@/newtab/drag-and-drop";
import LinkDropPreview from "@/newtab/components/LinkDropPreview";
import LinkItemWrapper from "@/newtab/components/LinkList/LinkItemWrapper";

interface LinkListProps {
  categoryLinks: Link[];
  parentId: string;
  categoryId: string;
  allowMerge?: boolean;
  showAddLinkCard?: boolean;
  handleEditClick: (linkId: string) => void;
  handleSkipClick: (url: string) => void;
  onMoveLink: (
    linkId: string,
    targetParentId: string,
    targetIndex: number
  ) => Promise<void>;
  onMergeLinks: (
    categoryId: string,
    targetLinkId: string,
    draggedLinkId: string
  ) => Promise<void>;
  onCancelDrag: () => Promise<void>;
  onEnterFolderContent: (item: LinkDragItem) => void;
  onOpenAddLink: () => void;
}

/** 渲染支持拖拽排序的网址列表和末尾添加入口。 */
export default function LinkList({
  categoryLinks,
  parentId,
  categoryId,
  allowMerge = false,
  showAddLinkCard = false,
  handleEditClick,
  handleSkipClick,
  onMoveLink,
  onMergeLinks,
  onCancelDrag,
  onEnterFolderContent,
  onOpenAddLink,
}: LinkListProps) {
  // 添加入口的本地化文案
  const { t } = useTranslation();

  // 按 sort 字段排序的链接列表
  const sortedLinks = useMemo(() => {
    return [...categoryLinks].sort((a, b) => a.sort - b.sort);
  }, [categoryLinks]);

  // 本地状态用于拖拽时的 UI 更新
  const [localLinks, setLocalLinks] = useState<Link[]>(() => sortedLinks);
  // 跨父级网址在当前文件夹中的原卡片预览
  const [linkDropPreview, setLinkDropPreview] = useState<{
    index: number;
    link: Link;
  } | null>(null);

  // 当 categoryLinks 更新时同步本地状态
  useEffect(() => {
    setLocalLinks(sortedLinks);
    setLinkDropPreview(null);
  }, [sortedLinks]);

  /* 编辑链接 */
  const onEditClick = useCallback(
    (linkId: string) => {
      handleEditClick(linkId);
    },
    [handleEditClick]
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
      if (item.sourceParentId !== parentId) {
        onEnterFolderContent(item);
        // 当前文件夹范围内的有效原卡片预览索引
        const targetIndex = Math.max(
          0,
          Math.min(hoverIndex, localLinks.length)
        );
        item.currentParentId = parentId;
        item.index = targetIndex;
        setLinkDropPreview((currentPreview) =>
          currentPreview?.index === targetIndex &&
          currentPreview.link.id === item.link.id
            ? currentPreview
            : { index: targetIndex, link: item.link }
        );
        return;
      }

      setLinkDropPreview(null);
      setLocalLinks((previousLinks) => {
        // 网址在当前预览列表中的位置
        const previousIndex = previousLinks.findIndex(
          (link) => link.id === item.link.id
        );
        // 同一列表向后移动时抵消移除产生的索引偏移
        const normalizedInsertIndex =
          previousIndex >= 0 && previousIndex < hoverIndex
            ? hoverIndex - 1
            : hoverIndex;
        // 移除被拖网址后的可用插入位置数量
        const remainingLinkCount =
          previousIndex >= 0 ? previousLinks.length - 1 : previousLinks.length;
        // 限制在有效范围内的预览插入位置
        const boundedInsertIndex = Math.max(
          0,
          Math.min(normalizedInsertIndex, remainingLinkCount)
        );
        if (
          item.currentParentId === parentId &&
          previousIndex === boundedInsertIndex
        ) {
          return previousLinks;
        }
        // 仅在位置变化时创建移除被拖网址后的预览列表
        const nextLinks = previousLinks.filter(
          (link) => link.id !== item.link.id
        );
        // 目标父级下的预览网址
        const previewLink = { ...item.link, parentId };
        nextLinks.splice(boundedInsertIndex, 0, previewLink);

        item.currentParentId = parentId;
        item.index = boundedInsertIndex;
        return nextLinks;
      });
    },
    [localLinks.length, onEnterFolderContent, parentId]
  );

  /* 松开鼠标时提交预览中的最终分类和位置。 */
  const onDrop = useCallback(
    (item: LinkDragItem, targetIndex: number) => {
      setLinkDropPreview(null);
      void onMoveLink(item.link.id, parentId, targetIndex);
    },
    [parentId, onMoveLink]
  );

  // 文件夹网格整体的投放状态与连接器
  const [{ isLinkOverList }, dropList] = useDrop<
    LinkDragItem,
    void,
    { isLinkOverList: boolean }
  >({
    accept: DRAG_ITEM_TYPE.LINK,
    /** 将网格空白区域作为列表末尾投放位置。 */
    hover(item, monitor) {
      if (!monitor.isOver({ shallow: true })) {
        return;
      }
      item.dropIntent = LINK_DROP_INTENT.MOVE;
      item.mergeTargetLinkId = undefined;
      item.targetLinkGroupId = undefined;
      onHover(item, localLinks.length);
    },
    /** 保存直接投放到网格空白区域的网址。 */
    drop(item, monitor) {
      if (!monitor.didDrop()) {
        onDrop(item, item.index);
      }
    },
    collect: (monitor) => ({
      isLinkOverList: monitor.isOver(),
    }),
  });

  // 列表末尾的投放状态和连接器
  const [{ isOverEnd }, dropAtEnd] = useDrop<
    LinkDragItem,
    void,
    { isOverEnd: boolean }
  >({
    accept: DRAG_ITEM_TYPE.LINK,
    /** 在列表末尾显示网址移动预览。 */
    hover(item) {
      item.dropIntent = LINK_DROP_INTENT.MOVE;
      item.mergeTargetLinkId = undefined;
      item.targetLinkGroupId = undefined;
      onHover(item, localLinks.length);
    },
    /** 将网址保存到列表末尾。 */
    drop(item) {
      onDrop(item, item.index);
    },
    collect: (monitor) => ({
      isOverEnd: monitor.isOver({ shallow: true }),
    }),
  });

  /** 将添加按钮注册为列表末尾的拖放目标。 */
  const addLinkRef = useCallback(
    (node: HTMLButtonElement | null) => {
      dropAtEnd(node);
    },
    [dropAtEnd]
  );

  /** 连接文件夹网格与网址投放区域。 */
  const connectListRef = useCallback(
    (node: HTMLDivElement | null) => {
      dropList(node);
    },
    [dropList]
  );

  useEffect(() => {
    if (!isLinkOverList) {
      setLinkDropPreview(null);
    }
  }, [isLinkOverList]);

  return (
    <div ref={connectListRef} className="grid min-h-20 grid-cols-3 gap-3">
      {localLinks.map((link, index) => {
        return (
          <Fragment key={link.id}>
            {linkDropPreview?.index === index && (
              <LinkDropPreview
                link={linkDropPreview.link}
                index={index}
                onHover={onHover}
                onDrop={onDrop}
              />
            )}
            <LinkItemWrapper
              link={link}
              index={index}
              onEditClick={onEditClick}
              onSkipClick={onSkipClick}
              onHover={onHover}
              onDrop={onDrop}
              onMergeLinks={onMergeLinks}
              onCancelDrag={onCancelDrag}
              allowMerge={allowMerge}
              categoryId={categoryId}
              parentId={parentId}
            />
          </Fragment>
        );
      })}

      {linkDropPreview?.index === localLinks.length && (
        <LinkDropPreview
          link={linkDropPreview.link}
          index={localLinks.length}
          onHover={onHover}
          onDrop={onDrop}
        />
      )}

      {(showAddLinkCard ||
        (localLinks.length === 0 && linkDropPreview === null)) && (
        <button
          type="button"
          ref={addLinkRef}
          className={cn(
            "flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-[rgba(48,50,54,0.38)] p-3 text-white/70 shadow-md shadow-black/10 backdrop-blur-xl outline-none transition-[transform,background-color,border-color,box-shadow,color] duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-[rgba(58,60,64,0.56)] hover:text-white/90 hover:shadow-lg hover:shadow-black/20 focus-visible:ring-2 focus-visible:ring-blue-200/80",
            !showAddLinkCard && "col-span-full h-20",
            isOverEnd && "ring-2 ring-blue-200/80 bg-white/20"
          )}
          onClick={onOpenAddLink}
        >
          <Plus size={showAddLinkCard ? 24 : 22} />
          <span className="text-sm font-medium">
            {showAddLinkCard
              ? t("link.addAction")
              : t("linkGroup.emptyHint")}
          </span>
        </button>
      )}
    </div>
  );
}
