import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  FolderPlus,
  Link2,
  Pin,
  Plus,
  Trash2,
} from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import DockLinkIcon from "@/newtab/components/Dock/DockLinkIcon";
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
  onPreviewMove: (linkId: string, targetIndex: number) => void;
  onDrop: (linkId: string, targetIndex: number) => void;
  onDragStart: () => void;
  onDragCancel: () => void;
  onDragEnd: () => void;
  onOpen: (url: string) => void;
  onUnpin: (linkId: string) => Promise<void>;
}

// Dock 中可点击操作的统一视觉样式
const DOCK_ACTION_CLASS =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white/65 outline-none transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-white/60 motion-reduce:transform-none motion-reduce:transition-none";

// Dock 添加菜单离开后的关闭缓冲时间
const DOCK_CREATE_MENU_CLOSE_DELAY_MS = 150;

/** 渲染可打开并支持拖拽排序的 Dock 网址。 */
function DockLinkItem({
  index,
  link,
  onPreviewMove,
  onDrop,
  onDragStart,
  onDragCancel,
  onDragEnd,
  onOpen,
  onUnpin,
}: DockLinkItemProps) {
  // Dock 网址文案的本地化工具
  const { t } = useTranslation();
  // Dock 网址拖拽目标引用
  const elementRef = useRef<HTMLDivElement>(null);
  // Dock 网址的拖动状态与连接器
  const [{ isDragging }, drag, preview] = useDrag<
    DockLinkDragItem,
    void,
    { isDragging: boolean }
  >({
    type: DRAG_ITEM_TYPE.DOCK_LINK,
    /** 创建 Dock 网址拖拽数据。 */
    item() {
      // Dock 网址当前的预览尺寸
      const { width, height } = elementRef.current!.getBoundingClientRect();
      onDragStart();
      return {
        type: DRAG_ITEM_TYPE.DOCK_LINK,
        linkId: link.id,
        link,
        previewWidth: width,
        previewHeight: height,
        index,
      };
    },
    /** 按网址标识保持重排后拖动源的视觉状态。 */
    isDragging(monitor) {
      return monitor.getItem().linkId === link.id;
    },
    /** 收集 Dock 网址当前是否正在拖动。 */
    collect(monitor) {
      return {
        isDragging: monitor.isDragging(),
      };
    },
    /** 在拖拽结束后恢复取消的预览并清理拖拽状态。 */
    end(_item, monitor) {
      if (!monitor.didDrop()) {
        onDragCancel();
      }
      onDragEnd();
    },
  });
  // Dock 网址的排序投放状态与连接器
  const [, drop] = useDrop<DockLinkDragItem, void>({
    accept: DRAG_ITEM_TYPE.DOCK_LINK,
    /** 越过目标网址中线后更新 Dock 的临时预览顺序。 */
    hover(item, monitor) {
      if (item.index === index) {
        return;
      }

      // 目标网址边界
      const targetRect = elementRef.current?.getBoundingClientRect();
      // 当前指针位置
      const clientOffset = monitor.getClientOffset();
      if (!targetRect || !clientOffset) {
        return;
      }

      // 目标网址横向中点
      const targetMiddleX = targetRect.width / 2;
      // 指针在目标网址中的横向位置
      const pointerX = clientOffset.x - targetRect.left;
      if (
        (item.index < index && pointerX < targetMiddleX) ||
        (item.index > index && pointerX > targetMiddleX)
      ) {
        return;
      }

      onPreviewMove(item.linkId, index);
      item.index = index;
    },
    /** 在 Dock 网址上松开时保存最终预览位置。 */
    drop(item) {
      onDrop(item.linkId, item.index);
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

  useEffect(() => {
    // 隐藏浏览器原生拖拽快照，改由页面自定义预览层渲染。
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  /** 打开当前 Dock 网址。 */
  function openDockLink() {
    onOpen(link.url);
  }

  /** 通过键盘从 Dock 取消固定当前网址。 */
  function handleDockLinkKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Delete" && event.key !== "Backspace") {
      return;
    }
    event.preventDefault();
    void onUnpin(link.id);
  }

  return (
    <div
      ref={connectDockLinkRef}
      className={cn(
        "group relative flex size-11 shrink-0 rounded-xl transition-[opacity,background-color,transform] duration-200 motion-reduce:transform-none motion-reduce:transition-none",
        "hover:bg-white/[0.07] focus-within:bg-white/[0.07]",
        isDragging && "opacity-50"
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex h-full w-full cursor-grab items-center justify-center rounded-xl text-white outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-blue-200/75"
            onClick={openDockLink}
            onKeyDown={handleDockLinkKeyDown}
            aria-label={t("dock.openLink", { title: link.title })}
            aria-keyshortcuts="Delete Backspace"
          >
            <span className="flex size-7 items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none">
              <DockLinkIcon link={link} />
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={8}
          className="border border-white/10 bg-[#202328] text-white shadow-lg motion-reduce:animate-none"
          arrowClassName="bg-[#202328] fill-[#202328]"
        >
          {link.title}
        </TooltipContent>
      </Tooltip>
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
  // Dock 拖拽期间展示的临时网址顺序
  const [previewDockLinks, setPreviewDockLinks] = useState(dockLinks);
  // Dock 当前是否正在预览排序位置
  const [isDockSorting, setIsDockSorting] = useState(false);
  // Dock 添加菜单是否打开
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  // 当前应渲染的 Dock 网址顺序
  const displayedDockLinks = isDockSorting ? previewDockLinks : dockLinks;
  // Dock 添加菜单待执行的关闭计时器
  const createMenuCloseTimerRef = useRef<number | null>(null);
  // Dock 添加菜单是否由鼠标悬停打开
  const isCreateMenuHoverOpenedRef = useRef(false);
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

  /** 开始 Dock 排序并暂缓外部顺序覆盖临时预览。 */
  function startDockLinkDrag() {
    setPreviewDockLinks(dockLinks);
    setIsDockSorting(true);
  }

  /** 按目标索引更新 Dock 的临时预览顺序。 */
  function previewDockLinkMove(linkId: string, targetIndex: number) {
    setPreviewDockLinks((currentLinks) => {
      // 被拖网址在当前预览顺序中的索引
      const sourceIndex = currentLinks.findIndex((link) => link.id === linkId);
      // 限制后的目标索引
      const boundedTargetIndex = Math.max(
        0,
        Math.min(targetIndex, currentLinks.length - 1)
      );
      if (sourceIndex < 0 || sourceIndex === boundedTargetIndex) {
        return currentLinks;
      }

      // 移除被拖网址后的预览顺序
      const reorderedLinks = currentLinks.filter((link) => link.id !== linkId);
      // 当前被拖动的网址
      const draggedLink = currentLinks[sourceIndex];
      reorderedLinks.splice(boundedTargetIndex, 0, draggedLink);
      return reorderedLinks;
    });
  }

  /** 保存 Dock 拖拽预览中的最终顺序。 */
  function commitDockLinkMove(linkId: string, targetIndex: number) {
    void onMoveDockLink(linkId, targetIndex);
  }

  /** 取消 Dock 排序时恢复持久化顺序。 */
  function cancelDockLinkDrag() {
    setPreviewDockLinks(dockLinks);
  }

  /** 结束 Dock 排序并允许继续同步外部顺序。 */
  function endDockLinkDrag() {
    setIsDockSorting(false);
  }

  /** 取消 Dock 添加菜单待执行的关闭操作。 */
  function cancelCreateMenuClose() {
    if (createMenuCloseTimerRef.current === null) {
      return;
    }
    window.clearTimeout(createMenuCloseTimerRef.current);
    createMenuCloseTimerRef.current = null;
  }

  /** 关闭 Dock 添加菜单并清理关闭计时器。 */
  function closeCreateMenu() {
    setIsCreateMenuOpen(false);
    createMenuCloseTimerRef.current = null;
  }

  /** 鼠标进入按钮或菜单时立即打开 Dock 添加菜单。 */
  function openCreateMenu() {
    cancelCreateMenuClose();
    if (isCreateMenuOpen) {
      return;
    }
    isCreateMenuHoverOpenedRef.current = true;
    setIsCreateMenuOpen(true);
  }

  /** 鼠标离开按钮或菜单后延迟关闭 Dock 添加菜单。 */
  function scheduleCreateMenuClose() {
    cancelCreateMenuClose();
    createMenuCloseTimerRef.current = window.setTimeout(
      closeCreateMenu,
      DOCK_CREATE_MENU_CLOSE_DELAY_MS
    );
  }

  /** 同步点击、键盘及外部交互产生的菜单开关状态。 */
  function handleCreateMenuOpenChange(open: boolean) {
    cancelCreateMenuClose();
    if (open) {
      isCreateMenuHoverOpenedRef.current = false;
    }
    setIsCreateMenuOpen(open);
  }

  /** 将菜单交互来源切换为键盘。 */
  function handleCreateMenuKeyDown() {
    isCreateMenuHoverOpenedRef.current = false;
  }

  /** 仅阻止悬停菜单关闭后自动聚焦加号按钮。 */
  function handleCreateMenuCloseAutoFocus(event: Event) {
    if (!isCreateMenuHoverOpenedRef.current) {
      return;
    }
    event.preventDefault();
    isCreateMenuHoverOpenedRef.current = false;
  }

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

  useEffect(() => {
    /** 清理组件卸载时仍未执行的 Dock 添加菜单关闭计时器。 */
    return () => {
      if (createMenuCloseTimerRef.current !== null) {
        window.clearTimeout(createMenuCloseTimerRef.current);
      }
    };
  }, []);

  return (
    <nav
      className="glass-style-floating fixed bottom-6 left-1/2 z-40 flex w-fit max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-1 rounded-2xl p-1.5 shadow-[0_14px_36px_rgba(0,0,0,0.28)] md:bottom-8"
      aria-label={t("dock.navigation")}
    >
      <DropdownMenu
        modal={false}
        open={isCreateMenuOpen}
        onOpenChange={handleCreateMenuOpenChange}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={DOCK_ACTION_CLASS}
            aria-label={t("dock.createContent")}
            onMouseEnter={openCreateMenu}
            onMouseLeave={scheduleCreateMenuClose}
            onKeyDown={handleCreateMenuKeyDown}
          >
            <Plus size={21} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={10}
          className="glass-style-overlay min-w-40 rounded-xl border-white/10 p-1.5 text-white shadow-[0_14px_36px_rgba(0,0,0,0.3)] motion-reduce:animate-none"
          onMouseEnter={openCreateMenu}
          onMouseLeave={scheduleCreateMenuClose}
          onKeyDown={handleCreateMenuKeyDown}
          onCloseAutoFocus={handleCreateMenuCloseAutoFocus}
        >
          <DropdownMenuItem
            className="cursor-pointer rounded-lg px-3 py-2.5 focus:bg-white/10 focus:text-white"
            onSelect={onAddLink}
          >
            <Link2 />
            {t("link.addAction")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer rounded-lg px-3 py-2.5 focus:bg-white/10 focus:text-white"
            onSelect={onCreateFolder}
          >
            <FolderPlus />
            {t("linkGroup.createAction")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <span
        className="h-7 w-px shrink-0 bg-white/10"
        aria-hidden="true"
      />

      <div
        ref={connectPinDropRef}
        className={cn(
          "relative flex h-11 max-w-[560px] items-center overflow-x-auto overflow-y-hidden rounded-xl",
          dockLinks.length === 0 ? "min-w-[110px]" : "w-fit min-w-0",
          "[scrollbar-color:rgba(255,255,255,0.24)_transparent] [scrollbar-width:thin]",
          "[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent",
          "transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none",
          isPinOver &&
            "bg-blue-100/10 shadow-[0_8px_24px_rgba(191,219,254,0.12)]"
        )}
        aria-label={t("dock.pinnedLinks")}
      >
        {displayedDockLinks.length === 0 ? (
          <div
            className="pointer-events-none flex min-w-[110px] items-center justify-center gap-2 whitespace-nowrap px-3 text-white/55"
            title={t("dock.emptyHint")}
          >
            <Pin size={16} />
            <span className="text-xs font-medium">{t("dock.emptyHint")}</span>
          </div>
        ) : (
          <div className="flex min-w-max items-center gap-1 px-0.5">
            {displayedDockLinks.map((link, index) => (
              <DockLinkItem
                key={link.id}
                index={index}
                link={link}
                onPreviewMove={previewDockLinkMove}
                onDrop={commitDockLinkMove}
                onDragStart={startDockLinkDrag}
                onDragCancel={cancelDockLinkDrag}
                onDragEnd={endDockLinkDrag}
                onOpen={onOpenLink}
                onUnpin={onUnpinDockLink}
              />
            ))}
          </div>
        )}
      </div>

      <span
        className={cn(
          "h-7 shrink-0 bg-white/10 transition-[width,opacity] duration-200 motion-reduce:transition-none",
          canDrop ? "w-px opacity-100" : "w-0 opacity-0"
        )}
        aria-hidden="true"
      />

      <div
        className={cn(
          "flex shrink-0 items-center overflow-hidden transition-[width,opacity] duration-200 motion-reduce:transition-none",
          canDrop ? "w-11 opacity-100" : "w-0 opacity-0",
          isTrashOver && "overflow-visible"
        )}
      >
        <div
          ref={connectTrashRef}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border border-transparent text-white/55 outline-none transition-[background-color,border-color,color,transform,box-shadow] duration-200 motion-reduce:transform-none motion-reduce:transition-none",
            canDrop &&
              "border-white/15 bg-white/[0.07] text-white/80",
            isTrashOver &&
              "scale-105 border-red-300/45 bg-red-400/15 text-red-200 shadow-[0_8px_22px_rgba(248,113,113,0.14)]"
          )}
          role="img"
          title={
            isTrashOver ? t("dock.releaseToRemove") : t("dock.trash")
          }
          aria-label={
            isTrashOver ? t("dock.releaseToRemove") : t("dock.trash")
          }
          aria-hidden={!canDrop}
        >
          <Trash2 size={20} />
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
