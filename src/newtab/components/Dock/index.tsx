import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FolderPlus,
  Link2,
  Pin,
  Plus,
  Trash2,
} from "lucide-react";
import { useDrop } from "react-dnd";
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
  onOpen: (url: string) => void;
  onUnpin: (linkId: string) => Promise<void>;
}

interface DockTrashProps {
  isOver: boolean;
  isVisible: boolean;
  connectReactDndDropRef: (node: HTMLDivElement | null) => void;
}

// Dock 中可点击操作的统一视觉样式
const DOCK_ACTION_CLASS =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white/65 outline-none transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-white/60 motion-reduce:transform-none motion-reduce:transition-none";

// Dock 添加菜单离开后的关闭缓冲时间
const DOCK_CREATE_MENU_CLOSE_DELAY_MS = 150;

// Dock 指针排序开始前允许的移动距离
const DOCK_DRAG_ACTIVATION_DISTANCE_PX = 6;

// Dock 在 dnd-kit 中使用的垃圾桶投放标识
const DOCK_TRASH_DROP_ID = "dock-trash";

/** 渲染可打开并支持拖拽排序的 Dock 网址。 */
function DockLinkItem({
  link,
  onOpen,
  onUnpin,
}: DockLinkItemProps) {
  // Dock 网址文案的本地化工具
  const { t } = useTranslation();
  // Dock 网址的指针排序状态与连接器
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
  } = useSortable({ id: link.id, transition: null });
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

/** 渲染同时支持 React DnD 与 dnd-kit 的 Dock 垃圾桶。 */
function DockTrash({
  isOver,
  isVisible,
  connectReactDndDropRef,
}: DockTrashProps) {
  // Dock 垃圾桶文案的本地化工具
  const { t } = useTranslation();
  // Dock 网址指针拖拽的垃圾桶投放连接器
  const { setNodeRef: setPointerDropRef } = useDroppable({
    id: DOCK_TRASH_DROP_ID,
  });

  /** 同时连接两套拖拽后端的垃圾桶投放能力。 */
  const connectTrashRef = useCallback(
    (node: HTMLDivElement | null) => {
      setPointerDropRef(node);
      connectReactDndDropRef(node);
    },
    [connectReactDndDropRef, setPointerDropRef]
  );

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
          ref={connectTrashRef}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border border-transparent text-white/55 outline-none transition-[background-color,border-color,color,transform,box-shadow] duration-200 motion-reduce:transform-none motion-reduce:transition-none",
            isVisible && "border-white/15 bg-white/[0.07] text-white/80",
            isOver &&
              "scale-105 border-red-300/45 bg-red-400/15 text-red-200 shadow-[0_8px_22px_rgba(248,113,113,0.14)]"
          )}
          role="img"
          title={isOver ? t("dock.releaseToRemove") : t("dock.trash")}
          aria-label={
            isOver ? t("dock.releaseToRemove") : t("dock.trash")
          }
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
  // 当前通过指针排序的 Dock 网址标识
  const [activeDockLinkId, setActiveDockLinkId] = useState<string | null>(null);
  // Dock 网址是否正悬停在垃圾桶上
  const [isDockTrashOver, setIsDockTrashOver] = useState(false);
  // Dock 指针排序传感器
  const dockSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DOCK_DRAG_ACTIVATION_DISTANCE_PX },
    })
  );
  // Dock 当前的可排序网址标识
  const dockLinkIds = dockLinks.map((link) => link.id);
  // 当前正在拖动的 Dock 网址
  const activeDockLink = dockLinks.find(
    (link) => link.id === activeDockLinkId
  );
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
  // 页面项目对应的垃圾桶拖拽状态与投放连接器
  const [{ canDrop: canDropPageItem, isOver: isPageTrashOver }, trashDrop] =
    useDrop<
    PageDragItem,
    void,
    { canDrop: boolean; isOver: boolean }
  >({
    accept: [
      DRAG_ITEM_TYPE.CATEGORY,
      DRAG_ITEM_TYPE.LINK,
      DRAG_ITEM_TYPE.LINK_GROUP,
    ],
    /** 删除投放到垃圾桶的页面项目。 */
    drop(item) {
      void onDropToTrash(item);
    },
    /** 收集垃圾桶当前是否可接收或命中拖拽对象。 */
    collect(monitor) {
      return {
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver({ shallow: true }),
      };
    },
  });
  // 垃圾桶当前是否需要展示
  const isTrashVisible = canDropPageItem || activeDockLinkId !== null;
  // 两套拖拽后端合并后的垃圾桶命中状态
  const isTrashOver = isPageTrashOver || isDockTrashOver;

  /** 优先命中垃圾桶，并将 Dock 排序限制在固定网址区域内。 */
  function detectDockCollision(args: Parameters<CollisionDetection>[0]) {
    // 指针当前直接覆盖的投放目标
    const pointerCollisions = pointerWithin(args);
    // 指针当前覆盖的垃圾桶目标
    const trashCollision = pointerCollisions.find(
      (collision) => collision.id === DOCK_TRASH_DROP_ID
    );
    if (trashCollision) {
      return [trashCollision];
    }

    // Dock 固定网址区域的当前边界
    const pinAreaBounds = pinAreaRef.current?.getBoundingClientRect();
    // dnd-kit 当前记录的指针位置
    const pointerCoordinates = args.pointerCoordinates;
    if (!pinAreaBounds || !pointerCoordinates) {
      return [];
    }

    // 指针当前是否位于 Dock 固定网址区域
    const isWithinPinArea =
      pointerCoordinates.x >= pinAreaBounds.left &&
      pointerCoordinates.x <= pinAreaBounds.right &&
      pointerCoordinates.y >= pinAreaBounds.top &&
      pointerCoordinates.y <= pinAreaBounds.bottom;
    if (!isWithinPinArea) {
      return [];
    }

    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container) => container.id !== DOCK_TRASH_DROP_ID
      ),
    });
  }

  /** 开始 Dock 指针排序。 */
  function handleDockDragStart(event: DragStartEvent) {
    setActiveDockLinkId(String(event.active.id));
    setIsDockTrashOver(false);
  }

  /** 同步 Dock 网址是否经过垃圾桶。 */
  function handleDockDragOver(event: DragOverEvent) {
    setIsDockTrashOver(event.over?.id === DOCK_TRASH_DROP_ID);
  }

  /** 清理 Dock 指针排序的界面状态。 */
  function finishDockDrag() {
    setActiveDockLinkId(null);
    setIsDockTrashOver(false);
  }

  /** 保存 Dock 指针排序或执行取消固定。 */
  function handleDockDragEnd(event: DragEndEvent) {
    // 当前拖动的网址标识
    const activeLinkId = String(event.active.id);
    // 当前命中的投放目标标识
    const overId = event.over?.id;
    finishDockDrag();
    if (!overId) {
      return;
    }
    if (overId === DOCK_TRASH_DROP_ID) {
      void onUnpinDockLink(activeLinkId);
      return;
    }

    // 当前投放目标在持久化顺序中的索引
    const targetIndex = dockLinks.findIndex((link) => link.id === overId);
    if (targetIndex < 0) {
      return;
    }
    void onMoveDockLink(activeLinkId, targetIndex);
  }

  /** 取消 Dock 指针排序并清理界面状态。 */
  function handleDockDragCancel() {
    finishDockDrag();
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

  /** 将垃圾桶元素注册为 React DnD 投放目标。 */
  const connectReactDndTrashRef = useCallback(
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
    if (!activeDockLinkId) {
      return;
    }

    // Dock 排序期间需要强制使用抓取手型的文档根节点
    const documentElement = document.documentElement;
    documentElement.dataset.dockDragging = "true";
    /** 清理 Dock 排序结束或组件卸载后的全局指针状态。 */
    return () => {
      delete documentElement.dataset.dockDragging;
    };
  }, [activeDockLinkId]);

  useEffect(() => {
    /** 清理组件卸载时仍未执行的 Dock 添加菜单关闭计时器。 */
    return () => {
      if (createMenuCloseTimerRef.current !== null) {
        window.clearTimeout(createMenuCloseTimerRef.current);
      }
    };
  }, []);

  return (
    <DndContext
      sensors={dockSensors}
      collisionDetection={detectDockCollision}
      onDragStart={handleDockDragStart}
      onDragOver={handleDockDragOver}
      onDragEnd={handleDockDragEnd}
      onDragCancel={handleDockDragCancel}
    >
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
          {dockLinks.length === 0 ? (
            <div
              className="pointer-events-none flex min-w-[110px] items-center justify-center gap-2 whitespace-nowrap px-3 text-white/55"
              title={t("dock.emptyHint")}
            >
              <Pin size={16} />
              <span className="text-xs font-medium">
                {t("dock.emptyHint")}
              </span>
            </div>
          ) : (
            <SortableContext
              items={dockLinkIds}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex min-w-max items-center gap-1 px-0.5">
                {dockLinks.map((link) => (
                  <DockLinkItem
                    key={link.id}
                    link={link}
                    onOpen={onOpenLink}
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
          connectReactDndDropRef={connectReactDndTrashRef}
        />

        <span className="sr-only" aria-live="polite">
          {isTrashOver
            ? t("dock.releaseToRemove")
            : isPinOver
            ? t("dock.releaseToPin")
            : ""}
        </span>
      </nav>

      <DragOverlay dropAnimation={null}>
        {activeDockLink ? (
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/20 bg-[rgba(58,60,64,0.94)] text-white shadow-lg shadow-black/30">
            <DockLinkIcon link={activeDockLink} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
