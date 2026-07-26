import { useCallback, useEffect, useRef, useState } from "react";
import {
  FolderPlus,
  Link2,
  Pin,
  Plus,
  Trash2,
} from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import Icon from "@/newtab/components/Icon";
import { isImageIcon } from "@/utils/icon";
import Setting from "@/newtab/components/Setting";
import {
  DRAG_ITEM_TYPE,
  type DockLinkDragItem,
  type DragItem,
  type LinkDragItem,
  type PageDragItem,
} from "@/newtab/drag-and-drop";
import type { Link } from "@/type/db";

interface DockProps {
  dockLinks: Link[];
  onAddLink: () => void;
  onCreateFolder: () => void;
  onOpenLink: (url: string) => void;
  onPinLink: (item: LinkDragItem) => Promise<void>;
  onMoveDockLink: (linkId: string, targetIndex: number) => Promise<void>;
  onUnpinDockLink: (linkId: string) => Promise<void>;
  onDropToTrash: (item: PageDragItem) => Promise<void>;
}

interface DockLinkItemProps {
  index: number;
  link: Link;
  onMove: (linkId: string, targetIndex: number) => Promise<void>;
  onOpen: (url: string) => void;
}

// Dock 中可点击操作的统一视觉样式
const DOCK_ACTION_CLASS =
  "flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white/65 outline-none transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/12 hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-white/60 motion-reduce:transform-none motion-reduce:transition-none";

/** 渲染可打开并支持拖拽排序的 Dock 网址。 */
function DockLinkItem({
  index,
  link,
  onMove,
  onOpen,
}: DockLinkItemProps) {
  // Dock 网址文案的本地化工具
  const { t } = useTranslation();
  // Dock 网址拖拽目标引用
  const elementRef = useRef<HTMLDivElement>(null);
  // 加载失败的图片图标值
  const [failedImageIcon, setFailedImageIcon] = useState("");
  // 当前网址是否配置了图片图标
  const hasImageIcon = isImageIcon(link.icon);
  // 当前网址是否可以展示图片图标
  const shouldShowImageIcon =
    hasImageIcon && failedImageIcon !== link.icon;
  // Dock 网址的拖动状态与连接器
  const [{ isDragging }, drag] = useDrag<
    DockLinkDragItem,
    void,
    { isDragging: boolean }
  >({
    type: DRAG_ITEM_TYPE.DOCK_LINK,
    /** 创建 Dock 网址拖拽数据。 */
    item() {
      return {
        type: DRAG_ITEM_TYPE.DOCK_LINK,
        linkId: link.id,
        index,
      };
    },
    /** 收集 Dock 网址当前是否正在拖动。 */
    collect(monitor) {
      return {
        isDragging: monitor.isDragging(),
      };
    },
  });
  // Dock 网址的排序投放状态与连接器
  const [{ isOver, isAfterTarget }, drop] = useDrop<
    DockLinkDragItem,
    void,
    { isOver: boolean; isAfterTarget: boolean }
  >({
    accept: DRAG_ITEM_TYPE.DOCK_LINK,
    /** 在目标网址上松开时计算最终插入位置。 */
    drop(item, monitor) {
      // 目标网址边界
      const targetRect = elementRef.current?.getBoundingClientRect();
      // 当前指针位置
      const clientOffset = monitor.getClientOffset();
      if (!targetRect || !clientOffset || item.linkId === link.id) {
        return;
      }

      // 指针是否位于目标网址右半侧
      const isAfterTarget =
        clientOffset.x >= targetRect.left + targetRect.width / 2;
      // 基于原列表计算的插入位置
      const rawTargetIndex = index + (isAfterTarget ? 1 : 0);
      // 移除来源项后修正的插入位置
      const targetIndex =
        item.index < rawTargetIndex ? rawTargetIndex - 1 : rawTargetIndex;
      void onMove(item.linkId, targetIndex);
      item.index = targetIndex;
    },
    /** 收集 Dock 网址当前是否被拖拽命中。 */
    collect(monitor) {
      // 当前网址是否被 Dock 项目命中
      const isOver = monitor.isOver({ shallow: true });
      // 当前网址的屏幕边界
      const targetRect = elementRef.current?.getBoundingClientRect();
      // 当前拖拽指针位置
      const clientOffset = monitor.getClientOffset();
      return {
        isOver,
        isAfterTarget: Boolean(
          isOver &&
            targetRect &&
            clientOffset &&
            clientOffset.x >= targetRect.left + targetRect.width / 2
        ),
      };
    },
  });

  /** 同时连接 Dock 网址的拖动和排序投放能力。 */
  const connectDockLinkRef = useCallback(
    (node: HTMLDivElement | null) => {
      elementRef.current = node;
      drag(drop(node));
    },
    [drag, drop]
  );

  /** 打开当前 Dock 网址。 */
  function openDockLink() {
    onOpen(link.url);
  }

  /** 标记当前图片图标加载失败。 */
  function handleImageIconError() {
    setFailedImageIcon(link.icon);
  }

  return (
    <div
      ref={connectDockLinkRef}
      className={cn(
        "relative flex size-12 shrink-0 rounded-xl transition-[opacity,background-color,transform] duration-200",
        "hover:-translate-y-0.5 hover:bg-white/[0.08] focus-within:bg-white/[0.08]",
        isDragging && "opacity-35",
        isOver && !isDragging && "bg-white/10",
        isOver &&
          !isDragging &&
          !isAfterTarget &&
          "before:absolute before:-left-0.5 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-blue-100",
        isOver &&
          !isDragging &&
          isAfterTarget &&
          "after:absolute after:-right-0.5 after:top-2 after:bottom-2 after:w-0.5 after:rounded-full after:bg-blue-100"
      )}
    >
      <button
        type="button"
        className="flex h-full w-full cursor-grab items-center justify-center rounded-xl text-white outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-blue-200/75"
        onClick={openDockLink}
        title={link.title}
        aria-label={t("dock.openLink", { title: link.title })}
      >
        <span className="flex size-8 items-center justify-center">
          {shouldShowImageIcon ? (
            <img
              src={link.icon}
              alt=""
              className="size-8 rounded-md object-contain"
              onError={handleImageIconError}
            />
          ) : (
            <Icon
              name={hasImageIcon ? "link" : link.icon || "link"}
              size={28}
              className="text-blue-100/90"
            />
          )}
        </span>
      </button>
    </div>
  );
}

/** 渲染页面底部的玻璃功能岛与拖拽垃圾桶。 */
export default function Dock({
  dockLinks,
  onAddLink,
  onCreateFolder,
  onOpenLink,
  onPinLink,
  onMoveDockLink,
  onUnpinDockLink,
  onDropToTrash,
}: DockProps) {
  // Dock 文案的本地化工具
  const { t } = useTranslation();
  // 固定网址横向滚动区域
  const pinAreaRef = useRef<HTMLDivElement>(null);
  // 上一次渲染时的固定网址数量
  const previousDockLinkCountRef = useRef(dockLinks.length);
  // 固定网址区域的拖拽状态与投放连接器
  const [{ isOver: isPinOver }, pinDrop] = useDrop<
    LinkDragItem,
    void,
    { isOver: boolean }
  >({
    accept: DRAG_ITEM_TYPE.LINK,
    /** 将网址固定到 Dock。 */
    drop(item) {
      void onPinLink(item);
    },
    /** 收集固定网址区域当前是否被命中。 */
    collect(monitor) {
      return {
        isOver: monitor.isOver({ shallow: true }),
      };
    },
  });
  // 垃圾桶的拖拽状态与投放连接器
  const [{ canDrop, isOver: isTrashOver }, trashDrop] = useDrop<
    DragItem,
    void,
    { canDrop: boolean; isOver: boolean }
  >({
    accept: [
      DRAG_ITEM_TYPE.CATEGORY,
      DRAG_ITEM_TYPE.LINK,
      DRAG_ITEM_TYPE.LINK_GROUP,
      DRAG_ITEM_TYPE.DOCK_LINK,
    ],
    /** 按拖拽项目类型分发删除或取消固定操作。 */
    drop(item) {
      // 不同拖拽项目对应的移除策略
      const removeStrategies: Record<DragItem["type"], () => void> = {
        [DRAG_ITEM_TYPE.CATEGORY]: () =>
          void onDropToTrash(item as PageDragItem),
        [DRAG_ITEM_TYPE.LINK]: () =>
          void onDropToTrash(item as PageDragItem),
        [DRAG_ITEM_TYPE.LINK_GROUP]: () =>
          void onDropToTrash(item as PageDragItem),
        [DRAG_ITEM_TYPE.DOCK_LINK]: () =>
          void onUnpinDockLink((item as DockLinkDragItem).linkId),
      };
      removeStrategies[item.type]();
    },
    /** 收集垃圾桶当前是否可接收或命中拖拽对象。 */
    collect(monitor) {
      return {
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver({ shallow: true }),
      };
    },
  });

  /** 将固定网址区域注册为投放目标。 */
  const connectPinDropRef = useCallback(
    (node: HTMLDivElement | null) => {
      pinAreaRef.current = node;
      pinDrop(node);
    },
    [pinDrop]
  );

  /** 将垃圾桶元素注册为投放目标。 */
  const connectTrashRef = useCallback(
    (node: HTMLDivElement | null) => {
      trashDrop(node);
    },
    [trashDrop]
  );

  useEffect(() => {
    if (dockLinks.length > previousDockLinkCountRef.current) {
      pinAreaRef.current?.scrollTo({
        left: pinAreaRef.current.scrollWidth,
      });
    }
    previousDockLinkCountRef.current = dockLinks.length;
  }, [dockLinks.length]);

  return (
    <nav
      className="glass-style-floating fixed bottom-4 left-1/2 z-40 flex w-fit max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-2xl p-2 shadow-[0_18px_48px_rgba(0,0,0,0.38)] md:bottom-6"
      aria-label={t("dock.navigation")}
    >
      <div
        className="flex shrink-0 items-center gap-0.5"
        aria-label={t("dock.actions")}
      >
        <button
          type="button"
          className={DOCK_ACTION_CLASS}
          onClick={onAddLink}
          title={t("link.addAction")}
          aria-label={t("link.addAction")}
        >
          <span className="relative">
            <Link2 size={22} />
            <Plus
              size={11}
              strokeWidth={2.5}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-[#26292e]"
            />
          </span>
        </button>
        <button
          type="button"
          className={DOCK_ACTION_CLASS}
          onClick={onCreateFolder}
          title={t("linkGroup.createAction")}
          aria-label={t("linkGroup.createAction")}
        >
          <FolderPlus size={22} />
        </button>
        <Setting triggerClassName={DOCK_ACTION_CLASS} />
      </div>

      <span
        className="h-9 w-px shrink-0 bg-white/15"
        aria-hidden="true"
      />

      <div
        ref={connectPinDropRef}
        className={cn(
          "relative flex h-14 min-w-[120px] max-w-[600px] items-center overflow-x-auto overflow-y-hidden rounded-xl p-0.5",
          "[scrollbar-color:rgba(255,255,255,0.24)_transparent] [scrollbar-width:thin]",
          "[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent",
          "transition-[background-color,box-shadow] duration-200",
          isPinOver &&
            "bg-blue-100/10 shadow-[0_8px_24px_rgba(191,219,254,0.12)]"
        )}
        aria-label={t("dock.pinnedLinks")}
      >
        {dockLinks.length === 0 ? (
          <div
            className="pointer-events-none flex min-w-[120px] items-center justify-center gap-2 whitespace-nowrap px-3 text-white/55"
            title={t("dock.emptyHint")}
          >
            <Pin size={18} />
            <span className="text-xs font-medium">{t("dock.emptyHint")}</span>
          </div>
        ) : (
          <div className="flex min-w-max items-center gap-1">
            {dockLinks.map((link, index) => (
              <DockLinkItem
                key={link.id}
                index={index}
                link={link}
                onMove={onMoveDockLink}
                onOpen={onOpenLink}
              />
            ))}
          </div>
        )}
      </div>

      <span
        className="h-9 w-px shrink-0 bg-white/15"
        aria-hidden="true"
      />

      <div className="flex shrink-0 items-center">
        <div
          ref={connectTrashRef}
          className={cn(
            "flex size-12 items-center justify-center rounded-xl border border-transparent text-white/55 outline-none transition-[background-color,border-color,color,transform,box-shadow] duration-200 motion-reduce:transform-none motion-reduce:transition-none",
            canDrop &&
              "scale-105 border-white/20 bg-white/10 text-white/85 shadow-[0_8px_24px_rgba(0,0,0,0.24)]",
            isTrashOver &&
              "scale-110 border-red-300/45 bg-red-400/15 text-red-200 shadow-[0_10px_28px_rgba(248,113,113,0.16)]"
          )}
          role="img"
          title={
            isTrashOver ? t("dock.releaseToRemove") : t("dock.trash")
          }
          aria-label={
            isTrashOver ? t("dock.releaseToRemove") : t("dock.trash")
          }
        >
          <Trash2 size={22} />
        </div>
      </div>

      <span className="sr-only" aria-live="polite">
        {isTrashOver
          ? t("dock.releaseToRemove")
          : isPinOver
          ? t("dock.releaseToPin")
          : ""}
      </span>
    </nav>
  );
}
