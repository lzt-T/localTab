import {
  Fragment,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useDrop } from "react-dnd";
import LinkFolderCard from "@/newtab/components/LinkFolderCard";
import LinkDropPreview from "@/newtab/components/LinkDropPreview";
import useAutoOpenFolder from "@/newtab/components/CategoryGrid/useAutoOpenFolder";
import {
  CategoryGridItemSlot,
  EmptyCategoryDropZone,
} from "@/newtab/components/CategoryGrid/CategoryGridCards";
import LinkItemWrapper from "@/newtab/components/LinkList/LinkItemWrapper";
import {
  DRAG_ITEM_TYPE,
  type LinkDragItem,
  type LinkGroupDragItem,
} from "@/newtab/drag-and-drop";
import {
  LinkType,
  type CategoryGridItem,
  type CategoryInfo,
  type Link,
  type LinkGroupInfo,
} from "@/type/db";

interface CategoryGridProps {
  categoryInfo: CategoryInfo;
  onOpenEditLink: (linkId: string) => void;
  onSkipLink: (url: string) => void;
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
  onMoveCategoryItem: (
    categoryId: string,
    itemId: string,
    targetIndex: number
  ) => Promise<void>;
  onCancelLinkDrag: () => Promise<void>;
  onOpenAddLink: (parentId: string) => void;
  onEditFolder: (linkGroup: LinkGroupInfo) => void;
}

/** 渲染分类内网址与文件夹混排的统一网格。 */
export default function CategoryGrid({
  categoryInfo,
  onOpenEditLink,
  onSkipLink,
  onMoveLink,
  onMergeLinks,
  onMoveCategoryItem,
  onCancelLinkDrag,
  onOpenAddLink,
  onEditFolder,
}: CategoryGridProps) {
  // 拖拽期间用于即时重排的网格项目
  const [localItems, setLocalItems] = useState<CategoryGridItem[]>(
    () => categoryInfo.items
  );
  // 跨父级网址在主网格中的原卡片预览
  const [linkDropPreview, setLinkDropPreview] = useState<{
    index: number;
    link: Link;
  } | null>(null);
  // 进入文件夹内部后需要保留槽位但隐藏的主网格拖拽源
  const [hiddenSourceLinkId, setHiddenSourceLinkId] = useState<string | null>(
    null
  );
  // 当前手动打开的文件夹标识
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  // 网址拖拽期间的文件夹自动展开控制器
  const {
    autoOpenFolderId,
    requestAutoOpen,
    cancelPendingAutoOpen,
    closeAutoOpenFolder,
  } = useAutoOpenFolder();
  // 网址是否位于当前主网格的投放范围
  const [{ isLinkOverGrid }, dropLinkGrid] = useDrop<
    LinkDragItem,
    void,
    { isLinkOverGrid: boolean }
  >({
    accept: DRAG_ITEM_TYPE.LINK,
    /** 收集网址是否位于当前主网格范围内。 */
    collect: (monitor) => ({
      isLinkOverGrid: monitor.isOver(),
    }),
  });

  /** 连接分类主网格与网址悬停监测区域。 */
  const connectGridRef = useCallback(
    (node: HTMLDivElement | null) => {
      dropLinkGrid(node);
    },
    [dropLinkGrid]
  );

  /** 清除跨父级网址在主网格中的原卡片预览。 */
  const onClearLinkDropPreview = useCallback(() => {
    setLinkDropPreview(null);
  }, []);

  /** 更新当前手动打开的唯一文件夹。 */
  const onManualFolderOpenChange = useCallback(
    (folderId: string, isOpen: boolean) => {
      setOpenFolderId((currentFolderId) => {
        if (isOpen) {
          return folderId;
        }
        return currentFolderId === folderId ? null : currentFolderId;
      });
    },
    []
  );

  /** 关闭手动与拖拽自动展开的全部文件夹浮层。 */
  const closeFolderPopovers = useCallback(() => {
    setOpenFolderId(null);
    closeAutoOpenFolder();
  }, [closeAutoOpenFolder]);

  /** 在网址进入文件夹内部时隐藏其主网格来源卡片。 */
  const onEnterFolderContent = useCallback(
    (item: LinkDragItem) => {
      setLinkDropPreview(null);
      if (item.sourceParentId === categoryInfo.id) {
        setHiddenSourceLinkId(item.link.id);
      }
    },
    [categoryInfo.id]
  );

  /** 在网址进入主网格合并目标时恢复来源卡片。 */
  const onEnterMainGridMergeTarget = useCallback(() => {
    closeFolderPopovers();
    setLinkDropPreview(null);
    setHiddenSourceLinkId(null);
  }, [closeFolderPopovers]);

  /** 清除来源卡片隐藏状态并恢复取消拖拽前的数据。 */
  const onCancelGridLinkDrag = useCallback(async () => {
    setHiddenSourceLinkId(null);
    await onCancelLinkDrag();
  }, [onCancelLinkDrag]);

  // 自动展开其他文件夹时清除不再显示的手动打开状态
  useEffect(() => {
    setLocalItems(categoryInfo.items);
    setLinkDropPreview(null);
    setHiddenSourceLinkId(null);
  }, [categoryInfo.items]);

  useEffect(() => {
    if (!isLinkOverGrid) {
      setLinkDropPreview(null);
    }
  }, [isLinkOverGrid]);

  useEffect(() => {
    if (autoOpenFolderId) {
      setOpenFolderId((currentFolderId) =>
        currentFolderId === autoOpenFolderId ? currentFolderId : null
      );
    }
  }, [autoOpenFolderId]);

  /** 预览网址在分类主网格中的目标位置。 */
  const onHoverLink = useCallback(
    (item: LinkDragItem, hoverIndex: number) => {
      closeFolderPopovers();
      setHiddenSourceLinkId(null);
      item.targetLinkGroupId = undefined;
      if (item.sourceParentId !== categoryInfo.id) {
        // 主网格范围内的有效原卡片预览索引
        const insertIndex = Math.max(
          0,
          Math.min(hoverIndex, localItems.length)
        );
        item.currentParentId = categoryInfo.id;
        item.index = insertIndex;
        setLinkDropPreview((currentPreview) =>
          currentPreview?.index === insertIndex &&
          currentPreview.link.id === item.link.id
            ? currentPreview
            : { index: insertIndex, link: item.link }
        );
        return;
      }

      setLinkDropPreview(null);
      setLocalItems((previousItems) => {
        // 网址当前所在的主网格位置
        const previousIndex = previousItems.findIndex(
          (gridItem) => gridItem.id === item.link.id
        );
        // 向后移动时抵消移除项目产生的索引偏移
        const normalizedInsertIndex =
          previousIndex >= 0 && previousIndex < hoverIndex
            ? hoverIndex - 1
            : hoverIndex;
        // 移除被拖网址后的可用插入位置数量
        const remainingItemCount =
          previousIndex >= 0 ? previousItems.length - 1 : previousItems.length;
        // 有效范围内的插入位置
        const insertIndex = Math.max(
          0,
          Math.min(normalizedInsertIndex, remainingItemCount)
        );
        if (previousIndex === insertIndex) {
          item.currentParentId = categoryInfo.id;
          item.index = insertIndex;
          return previousItems;
        }
        // 仅在位置变化时创建移除网址后的主网格项目
        const nextItems = previousItems.filter(
          (gridItem) => gridItem.id !== item.link.id
        );
        // 更新父级后的网址预览项目
        const previewLink = { ...item.link, parentId: categoryInfo.id };
        nextItems.splice(insertIndex, 0, previewLink);
        item.currentParentId = categoryInfo.id;
        item.index = insertIndex;
        return nextItems;
      });
    },
    [categoryInfo.id, closeFolderPopovers, localItems.length]
  );

  /** 保存网址在分类主网格中的最终位置。 */
  const onDropLink = useCallback(
    (item: LinkDragItem, targetIndex: number) => {
      setLinkDropPreview(null);
      // 拖拽项目记录的文件夹优先于当前分类作为最终父级
      const targetParentId = item.targetLinkGroupId ?? categoryInfo.id;
      void onMoveLink(item.link.id, targetParentId, targetIndex);
    },
    [categoryInfo.id, onMoveLink]
  );

  /** 预览文件夹在分类主网格中的目标位置。 */
  const onHoverFolder = useCallback(
    (item: LinkGroupDragItem, hoverIndex: number) => {
      setLocalItems((previousItems) => {
        // 文件夹当前所在的主网格位置
        const previousIndex = previousItems.findIndex(
          (gridItem) => gridItem.id === item.id
        );
        // 移除文件夹后的主网格项目
        const nextItems = previousItems.filter(
          (gridItem) => gridItem.id !== item.id
        );
        // 向后移动时抵消移除项目产生的索引偏移
        const normalizedInsertIndex =
          previousIndex >= 0 && previousIndex < hoverIndex
            ? hoverIndex - 1
            : hoverIndex;
        // 有效范围内的插入位置
        const insertIndex = Math.max(
          0,
          Math.min(normalizedInsertIndex, nextItems.length)
        );
        item.index = insertIndex;
        item.targetIndex = insertIndex;
        if (previousIndex >= 0 && previousIndex === insertIndex) {
          return previousItems;
        }
        // 当前拖动或跨区预览的文件夹项目
        const draggedFolder =
          previousItems[previousIndex] ?? {
            ...item.linkGroup,
            parentId: categoryInfo.id,
          };
        nextItems.splice(insertIndex, 0, draggedFolder);
        return nextItems;
      });
    },
    [categoryInfo.id]
  );

  /** 保存文件夹在分类主网格中的最终位置。 */
  const onDropFolder = useCallback(
    (item: LinkGroupDragItem) => {
      void onMoveCategoryItem(categoryInfo.id, item.id, item.targetIndex);
    },
    [categoryInfo.id, onMoveCategoryItem]
  );

  return (
    <div
      ref={connectGridRef}
      className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8"
    >
      {localItems.length === 0 && (
        <EmptyCategoryDropZone
          categoryId={categoryInfo.id}
          onMoveLink={onMoveLink}
          onMoveCategoryItem={onMoveCategoryItem}
        />
      )}

      {localItems.map((item, index) => (
        <Fragment key={item.id}>
          {linkDropPreview?.index === index && (
            <LinkDropPreview
              link={linkDropPreview.link}
              index={index}
              onHover={onHoverLink}
              onDrop={onDropLink}
            />
          )}
          <CategoryGridItemSlot
            index={index}
            isHidden={
              item.type === LinkType.LINK && item.id === hiddenSourceLinkId
            }
            linkDropFolder={
              item.type === LinkType.LINK_GROUP && item.id === autoOpenFolderId
                ? item
                : undefined
            }
            onClearLinkDropPreview={onClearLinkDropPreview}
            onHoverLink={onHoverLink}
            onDropLink={onDropLink}
            onHoverFolder={onHoverFolder}
            onDropFolder={onDropFolder}
          >
            {item.type === LinkType.LINK ? (
              <LinkItemWrapper
                link={item}
                index={index}
                onEditClick={onOpenEditLink}
                onSkipClick={onSkipLink}
                onHover={onHoverLink}
                onDrop={onDropLink}
                onMergeLinks={onMergeLinks}
                onCancelDrag={onCancelGridLinkDrag}
                allowMerge
                onEnterMergeTarget={onEnterMainGridMergeTarget}
                categoryId={categoryInfo.id}
                parentId={categoryInfo.id}
              />
            ) : (
              <LinkFolderCard
                linkGroup={item}
                categoryId={categoryInfo.id}
                index={index}
                onHoverLink={onHoverLink}
                onDropLink={onDropLink}
                onClearLinkDropPreview={onClearLinkDropPreview}
                onEnterFolderContent={onEnterFolderContent}
                isManuallyOpen={openFolderId === item.id}
                autoOpenFolderId={autoOpenFolderId}
                onManualOpenChange={onManualFolderOpenChange}
                onRequestAutoOpen={requestAutoOpen}
                onCancelPendingAutoOpen={cancelPendingAutoOpen}
                onOpenAddLink={onOpenAddLink}
                onOpenEditLink={onOpenEditLink}
                onSkipLink={onSkipLink}
                onMoveLink={onMoveLink}
                onMergeLinks={onMergeLinks}
                onCancelLinkDrag={onCancelGridLinkDrag}
                onEditFolder={onEditFolder}
              />
            )}
          </CategoryGridItemSlot>
        </Fragment>
      ))}

      {linkDropPreview?.index === localItems.length && (
        <LinkDropPreview
          link={linkDropPreview.link}
          index={localItems.length}
          onHover={onHoverLink}
          onDrop={onDropLink}
        />
      )}
    </div>
  );
}
