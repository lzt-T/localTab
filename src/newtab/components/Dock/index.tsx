import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FolderPlus, Link2, Pin, Plus, Trash2 } from "lucide-react";
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
import { usePageDnd } from "@/newtab/components/PageDndProvider";
import {
  DRAG_ITEM_TYPE,
  DROP_TARGET_TYPE,
  createDndId,
  type DndSourceData,
  type DndTargetData,
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
  link: Link;
  index: number;
  onOpen: (url: string) => void;
  onMove: (linkId: string, targetIndex: number) => Promise<void>;
  onUnpin: (linkId: string) => Promise<void>;
}

interface DockTrashProps {
  isOver: boolean;
  isVisible: boolean;
  setNodeRef: (node: HTMLDivElement | null) => void;
}

// Dock 中可点击操作的统一视觉样式
const DOCK_ACTION_CLASS =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white/65 outline-none transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-white/60 motion-reduce:transform-none motion-reduce:transition-none";

// Dock 添加菜单离开后的关闭缓冲时间
const DOCK_CREATE_MENU_CLOSE_DELAY_MS = 150;

/** 渲染可打开并支持拖拽排序的 Dock 网址。 */
function DockLinkItem({
  link,
  index,
  onOpen,
  onMove,
  onUnpin,
}: DockLinkItemProps) {
  // Dock 网址文案的本地化工具
  const { t } = useTranslation();
  // Dock 网址同时携带的拖拽源和投放目标数据
  const dndData = useMemo<DndSourceData & DndTargetData>(
    () => ({
      itemType: DRAG_ITEM_TYPE.DOCK_LINK,
      /** 创建 Dock 网址拖拽开始时的稳定会话数据。 */
      createDragItem() {
        return {
          type: DRAG_ITEM_TYPE.DOCK_LINK,
          link,
          index,
          targetIndex: index,
        };
      },
      type: DROP_TARGET_TYPE.DOCK_LINK,
      accepts: [DRAG_ITEM_TYPE.DOCK_LINK],
      scopeId: "dock",
      /** 记录 Dock 网址当前经过的排序位置。 */
      onDragMove(dragItem) {
        // 当前 Dock 网址拖拽数据
        const item = dragItem as DockLinkDragItem;
        item.targetIndex = index;
      },
      /** 保存 Dock 网址最终排序位置。 */
      onDrop(dragItem) {
        // 当前 Dock 网址拖拽数据
        const item = dragItem as DockLinkDragItem;
        void onMove(item.link.id, item.targetIndex);
      },
    }),
    [index, link, onMove]
  );
  // Dock 网址的排序状态与连接器
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
  } = useSortable({
    id: createDndId("dock-link", link.id),
    data: dndData,
    transition: null,
  });
  // Dock 网址排序期间的位移样式
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
  };

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
      ref={setNodeRef}
      style={sortableStyle}
      className={cn(
        "group relative flex size-11 shrink-0 rounded-xl transition-[opacity,background-color,transform] duration-200 motion-reduce:transform-none motion-reduce:transition-none",
        "hover:bg-white/[0.07] focus-within:bg-white/[0.07]",
        isDragging && "opacity-50"
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="flex h-full w-full touch-none cursor-pointer items-center justify-center rounded-xl text-white outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-blue-200/75"
            onClick={openDockLink}
            onKeyDown={handleDockLinkKeyDown}
            aria-label={t("dock.openLink", { title: link.title })}
            aria-keyshortcuts="Delete Backspace"
            {...attributes}
            {...listeners}
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

/** 渲染由 dnd-kit 驱动的 Dock 垃圾桶。 */
function DockTrash({ isOver, isVisible, setNodeRef }: DockTrashProps) {
  // Dock 垃圾桶文案的本地化工具
  const { t } = useTranslation();
  return (
    <>
      <span
        className={cn(
          "h-7 shrink-0 bg-white/10 transition-[width,opacity] duration-200 motion-reduce:transition-none",
          isVisible ? "w-px opacity-100" : "w-0 opacity-0"
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "flex shrink-0 items-center overflow-hidden transition-[width,opacity] duration-200 motion-reduce:transition-none",
          isVisible ? "w-11 opacity-100" : "w-0 opacity-0",
          isOver && "overflow-visible"
        )}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border border-transparent text-white/55 outline-none transition-[background-color,border-color,color,transform,box-shadow] duration-200 motion-reduce:transform-none motion-reduce:transition-none",
            isVisible && "border-white/15 bg-white/[0.07] text-white/80",
            isOver &&
              "scale-105 border-red-300/45 bg-red-400/15 text-red-200 shadow-[0_8px_22px_rgba(248,113,113,0.14)]"
          )}
          role="img"
          title={isOver ? t("dock.releaseToRemove") : t("dock.trash")}
          aria-label={isOver ? t("dock.releaseToRemove") : t("dock.trash")}
          aria-hidden={!isVisible}
        >
          <Trash2 size={20} />
        </div>
      </div>
    </>
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
  // Dock 添加菜单是否打开
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  // 当前页面拖拽会话
  const { activeItem } = usePageDnd();
  // Dock 当前的可排序网址标识
  const dockLinkIds = dockLinks.map((link) =>
    createDndId("dock-link", link.id)
  );
  // Dock 添加菜单待执行的关闭计时器
  const createMenuCloseTimerRef = useRef<number | null>(null);
  // Dock 添加菜单是否由鼠标悬停打开
  const isCreateMenuHoverOpenedRef = useRef(false);
  // 固定网址横向滚动区域
  const pinAreaRef = useRef<HTMLDivElement>(null);
  // 上一次渲染时的固定网址数量
  const previousDockLinkCountRef = useRef(dockLinks.length);
  // Dock 固定区域携带的投放目标数据
  const pinAreaTargetData: DndTargetData = {
    type: DROP_TARGET_TYPE.DOCK_AREA,
    accepts: [DRAG_ITEM_TYPE.LINK, DRAG_ITEM_TYPE.DOCK_LINK],
    scopeId: "dock",
    /** 将页面网址固定到 Dock。 */
    onDrop(item) {
      // 不同拖拽项目对应的 Dock 区域投放策略
      const dropStrategies: Partial<Record<DragItem["type"], () => void>> = {
        [DRAG_ITEM_TYPE.LINK]: () => void onPinLink(item as LinkDragItem),
      };
      dropStrategies[item.type]?.();
    },
  };
  // 固定网址区域的拖拽状态与投放连接器
  const { isOver: isPinOver, setNodeRef: setPinAreaNodeRef } = useDroppable({
    id: createDndId("dock-area"),
    data: pinAreaTargetData,
  });
  // Dock 垃圾桶携带的投放目标数据
  const trashTargetData: DndTargetData = {
    type: DROP_TARGET_TYPE.TRASH,
    accepts: [
      DRAG_ITEM_TYPE.CATEGORY,
      DRAG_ITEM_TYPE.LINK,
      DRAG_ITEM_TYPE.LINK_GROUP,
      DRAG_ITEM_TYPE.DOCK_LINK,
    ],
    scopeId: "trash",
    /** 按拖拽项目类型执行页面删除或 Dock 取消固定。 */
    onDrop(item) {
      // 不同拖拽项目对应的垃圾桶投放策略
      const dropStrategies: Record<DragItem["type"], () => void> = {
        [DRAG_ITEM_TYPE.CATEGORY]: () =>
          void onDropToTrash(item as PageDragItem),
        [DRAG_ITEM_TYPE.LINK]: () =>
          void onDropToTrash(item as PageDragItem),
        [DRAG_ITEM_TYPE.LINK_GROUP]: () =>
          void onDropToTrash(item as PageDragItem),
        [DRAG_ITEM_TYPE.DOCK_LINK]: () =>
          void onUnpinDockLink((item as DockLinkDragItem).link.id),
      };
      dropStrategies[item.type]();
    },
  };
  // 垃圾桶的命中状态与投放连接器
  const { isOver: isTrashOver, setNodeRef: setTrashNodeRef } = useDroppable({
    id: createDndId("dock-trash"),
    data: trashTargetData,
  });
  // 垃圾桶当前是否需要展示
  const isTrashVisible = activeItem !== null;

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

  /** 连接固定网址区域与 dnd-kit 投放目标。 */
  const connectPinAreaRef = useCallback(
    (node: HTMLDivElement | null) => {
      pinAreaRef.current = node;
      setPinAreaNodeRef(node);
    },
    [setPinAreaNodeRef]
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

      <span className="h-7 w-px shrink-0 bg-white/10" aria-hidden="true" />

      <div
        ref={connectPinAreaRef}
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
        {dockLinks.length === 0 ? (
          <div
            className="pointer-events-none flex min-w-[110px] items-center justify-center gap-2 whitespace-nowrap px-3 text-white/55"
            title={t("dock.emptyHint")}
          >
            <Pin size={16} />
            <span className="text-xs font-medium">{t("dock.emptyHint")}</span>
          </div>
        ) : (
          <SortableContext
            items={dockLinkIds}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex min-w-max items-center gap-1 px-0.5">
              {dockLinks.map((link, index) => (
                <DockLinkItem
                  key={link.id}
                  link={link}
                  index={index}
                  onOpen={onOpenLink}
                  onMove={onMoveDockLink}
                  onUnpin={onUnpinDockLink}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      <DockTrash
        isOver={isTrashOver}
        isVisible={isTrashVisible}
        setNodeRef={setTrashNodeRef}
      />

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
