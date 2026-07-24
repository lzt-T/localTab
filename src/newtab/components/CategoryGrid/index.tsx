import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { useDrop } from "react-dnd";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import LinkFolderCard from "@/newtab/components/LinkFolderCard";
import LinkDropPreview from "@/newtab/components/LinkDropPreview";
import useAutoOpenFolder from "@/newtab/components/CategoryGrid/useAutoOpenFolder";
import LinkItemWrapper from "@/newtab/components/LinkList/LinkItemWrapper";
import {
  DRAG_ITEM_TYPE,
  LINK_DROP_INTENT,
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
  onDeleteLink: (linkId: string) => void;
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
  onDeleteFolder: (linkGroup: LinkGroupInfo) => void;
}

interface CategoryGridItemSlotProps {
  index: number;
  isHidden?: boolean;
  linkDropFolder?: LinkGroupInfo;
  children: ReactNode;
  onClearLinkDropPreview: () => void;
  onHoverLink: (item: LinkDragItem, targetIndex: number) => void;
  onDropLink: (item: LinkDragItem, targetIndex: number) => void;
  onHoverFolder: (item: LinkGroupDragItem, targetIndex: number) => void;
  onDropFolder: (item: LinkGroupDragItem) => void;
}

interface CategoryGridEndCardProps {
  itemCount: number;
  onOpenAddLink: () => void;
  onHoverLink: (item: LinkDragItem, targetIndex: number) => void;
  onDropLink: (item: LinkDragItem, targetIndex: number) => void;
  onHoverFolder: (item: LinkGroupDragItem, targetIndex: number) => void;
  onDropFolder: (item: LinkGroupDragItem) => void;
}

/** 为每个网格位置提供文件夹排序投放能力。 */
function CategoryGridItemSlot({
  index,
  isHidden = false,
  linkDropFolder,
  children,
  onClearLinkDropPreview,
  onHoverLink,
  onDropLink,
  onHoverFolder,
  onDropFolder,
}: CategoryGridItemSlotProps) {
  // 网格位置元素引用
  const slotRef = useRef<HTMLDivElement>(null);
  // 网格间隙悬停状态与投放连接器
  const [{ isItemOver }, dropItem] = useDrop<
    LinkDragItem | LinkGroupDragItem,
    void,
    { isItemOver: boolean }
  >({
    accept: [DRAG_ITEM_TYPE.LINK, DRAG_ITEM_TYPE.LINK_GROUP],
    /** 根据卡片左右区域计算项目插入位置。 */
    hover(item, monitor) {
      if (!monitor.isOver({ shallow: true })) {
        return;
      }
      if (item.type === DRAG_ITEM_TYPE.LINK && linkDropFolder) {
        // 自动展开文件夹过渡区内的当前网址拖拽数据
        const linkItem = item as LinkDragItem;
        linkItem.dropIntent = LINK_DROP_INTENT.MOVE;
        linkItem.mergeTargetLinkId = undefined;
        linkItem.targetLinkGroupId = linkDropFolder.id;
        linkItem.currentParentId = linkDropFolder.id;
        linkItem.index = linkDropFolder.links.length;
        onClearLinkDropPreview();
        return;
      }
      // 当前指针位置
      const clientOffset = monitor.getClientOffset();
      // 当前网格卡片边界
      const slotRect = slotRef.current?.getBoundingClientRect();
      if (!clientOffset || !slotRect) {
        return;
      }
      // 指针在卡片中的横向比例
      const horizontalRatio =
        (clientOffset.x - slotRect.left) / slotRect.width;
      // 卡片左侧插入前方，右侧插入后方
      const targetIndex = horizontalRatio < 0.5 ? index : index + 1;
      // 不同拖拽项目的网格间隙悬停策略
      const hoverStrategies = {
        [DRAG_ITEM_TYPE.LINK]: () => {
          // 当前网址拖拽数据
          const linkItem = item as LinkDragItem;
          linkItem.dropIntent = LINK_DROP_INTENT.MOVE;
          linkItem.mergeTargetLinkId = undefined;
          linkItem.targetLinkGroupId = undefined;
          onHoverLink(linkItem, targetIndex);
        },
        [DRAG_ITEM_TYPE.LINK_GROUP]: () =>
          onHoverFolder(item as LinkGroupDragItem, targetIndex),
      };
      hoverStrategies[item.type]();
    },
    /** 保存从网格间隙投放的项目位置。 */
    drop(item, monitor) {
      if (monitor.didDrop()) {
        return;
      }
      // 不同拖拽项目的网格间隙投放策略
      const dropStrategies = {
        [DRAG_ITEM_TYPE.LINK]: () =>
          onDropLink(item as LinkDragItem, (item as LinkDragItem).index),
        [DRAG_ITEM_TYPE.LINK_GROUP]: () =>
          onDropFolder(item as LinkGroupDragItem),
      };
      dropStrategies[item.type]();
    },
    collect: (monitor) => ({
      isItemOver: monitor.isOver({ shallow: true }),
    }),
  });

  /** 连接网格位置与项目投放区域。 */
  const connectSlotRef = useCallback(
    (node: HTMLDivElement | null) => {
      slotRef.current = node;
      dropItem(node);
    },
    [dropItem]
  );

  return (
    <div
      ref={connectSlotRef}
      className={cn(
        "relative -m-2.5 rounded-[26px] p-2.5 transition-[opacity,box-shadow]",
        isHidden && "opacity-0",
        isItemOver &&
          linkDropFolder &&
          "ring-2 ring-amber-200/80 shadow-lg shadow-amber-200/10",
        isItemOver &&
          !linkDropFolder &&
          "ring-2 ring-blue-200/70 shadow-lg shadow-blue-200/10"
      )}
    >
      {children}
    </div>
  );
}

/** 渲染主网格末尾的添加与拖放入口。 */
function CategoryGridEndCard({
  itemCount,
  onOpenAddLink,
  onHoverLink,
  onDropLink,
  onHoverFolder,
  onDropFolder,
}: CategoryGridEndCardProps) {
  // 添加卡片的本地化文案
  const { t } = useTranslation();
  // 末尾投放状态与连接器
  const [{ isOverEnd }, dropAtEnd] = useDrop<
    LinkDragItem | LinkGroupDragItem,
    void,
    { isOverEnd: boolean }
  >({
    accept: [DRAG_ITEM_TYPE.LINK, DRAG_ITEM_TYPE.LINK_GROUP],
    /** 将拖拽项目预览移动到网格末尾。 */
    hover(item) {
      // 不同拖拽项目的末尾悬停策略
      const hoverStrategies = {
        [DRAG_ITEM_TYPE.LINK]: () => {
          // 当前网址拖拽数据
          const linkItem = item as LinkDragItem;
          linkItem.dropIntent = LINK_DROP_INTENT.MOVE;
          linkItem.mergeTargetLinkId = undefined;
          linkItem.targetLinkGroupId = undefined;
          onHoverLink(linkItem, itemCount);
        },
        [DRAG_ITEM_TYPE.LINK_GROUP]: () =>
          onHoverFolder(item as LinkGroupDragItem, itemCount),
      };
      hoverStrategies[item.type]();
    },
    /** 保存拖拽项目的末尾位置。 */
    drop(item) {
      // 不同拖拽项目的末尾投放策略
      const dropStrategies = {
        [DRAG_ITEM_TYPE.LINK]: () =>
          onDropLink(item as LinkDragItem, (item as LinkDragItem).index),
        [DRAG_ITEM_TYPE.LINK_GROUP]: () =>
          onDropFolder(item as LinkGroupDragItem),
      };
      dropStrategies[item.type]();
    },
    collect: (monitor) => ({
      isOverEnd: monitor.isOver({ shallow: true }),
    }),
  });

  /** 连接添加卡片与网格末尾投放区域。 */
  const addLinkRef = useCallback(
    (node: HTMLButtonElement | null) => {
      dropAtEnd(node);
    },
    [dropAtEnd]
  );

  return (
    <button
      type="button"
      ref={addLinkRef}
      className={cn(
        "flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/25 bg-[rgba(58,60,64,0.42)] p-4 text-white/75 shadow-lg shadow-black/10 backdrop-blur-xl outline-none transition-[transform,background-color,border-color,box-shadow,color] duration-200 hover:-translate-y-1 hover:border-white/45 hover:bg-[rgba(68,70,74,0.58)] hover:text-white/90 hover:shadow-xl hover:shadow-black/20 focus-visible:ring-2 focus-visible:ring-blue-200/80",
        isOverEnd && "border-blue-200/70 bg-white/20 ring-2 ring-blue-200/80"
      )}
      onClick={onOpenAddLink}
    >
      <Plus size={28} />
      <span className="text-sm font-medium">{t("link.addAction")}</span>
    </button>
  );
}

/** 渲染分类内网址与文件夹混排的统一网格。 */
export default function CategoryGrid({
  categoryInfo,
  onOpenEditLink,
  onDeleteLink,
  onSkipLink,
  onMoveLink,
  onMergeLinks,
  onMoveCategoryItem,
  onCancelLinkDrag,
  onOpenAddLink,
  onEditFolder,
  onDeleteFolder,
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
      if (item.categoryId !== categoryInfo.id) {
        return;
      }
      setLocalItems((previousItems) => {
        // 文件夹当前所在的主网格位置
        const previousIndex = previousItems.findIndex(
          (gridItem) => gridItem.id === item.id
        );
        if (previousIndex < 0) {
          return previousItems;
        }
        // 移除文件夹后的主网格项目
        const nextItems = previousItems.filter(
          (gridItem) => gridItem.id !== item.id
        );
        // 向后移动时抵消移除项目产生的索引偏移
        const normalizedInsertIndex =
          previousIndex < hoverIndex ? hoverIndex - 1 : hoverIndex;
        // 有效范围内的插入位置
        const insertIndex = Math.max(
          0,
          Math.min(normalizedInsertIndex, nextItems.length)
        );
        item.index = insertIndex;
        item.targetIndex = insertIndex;
        if (previousIndex === insertIndex) {
          return previousItems;
        }
        // 当前拖动的文件夹项目
        const draggedFolder = previousItems[previousIndex];
        nextItems.splice(insertIndex, 0, draggedFolder);
        return nextItems;
      });
    },
    [categoryInfo.id]
  );

  /** 保存文件夹在分类主网格中的最终位置。 */
  const onDropFolder = useCallback(
    (item: LinkGroupDragItem) => {
      if (item.categoryId !== categoryInfo.id) {
        return;
      }
      void onMoveCategoryItem(categoryInfo.id, item.id, item.targetIndex);
    },
    [categoryInfo.id, onMoveCategoryItem]
  );

  return (
    <div
      ref={connectGridRef}
      className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8"
    >
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
                onDeleteClick={onDeleteLink}
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
                onDeleteLink={onDeleteLink}
                onSkipLink={onSkipLink}
                onMoveLink={onMoveLink}
                onMergeLinks={onMergeLinks}
                onCancelLinkDrag={onCancelGridLinkDrag}
                onEditFolder={onEditFolder}
                onDeleteFolder={onDeleteFolder}
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

      <CategoryGridEndCard
        itemCount={localItems.length}
        onOpenAddLink={() => onOpenAddLink(categoryInfo.id)}
        onHoverLink={onHoverLink}
        onDropLink={onDropLink}
        onHoverFolder={onHoverFolder}
        onDropFolder={onDropFolder}
      />
    </div>
  );
}
