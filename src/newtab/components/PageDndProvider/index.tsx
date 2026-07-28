import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type AutoScrollOptions,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import LinkDragPreview from "@/newtab/components/LinkList/LinkDragPreview";
import {
  createPageCollisionRuntime,
  type PageCollisionTarget,
} from "@/newtab/components/PageDndProvider/page-collision-detection";
import {
  DRAG_ITEM_TYPE,
  createDndId,
  isDndSourceData,
  type DndSourceData,
  type DndTargetData,
  type DragItem,
  type DragMoveContext,
} from "@/newtab/drag-and-drop";

interface PageDndProviderProps {
  children: ReactNode;
}

interface PageDndContextValue {
  activeItem: DragItem | null;
}

interface PendingDragMove {
  key: string;
  item: DragItem;
  targetData: DndTargetData;
  context: DragMoveContext;
}

// 页面拖拽开始前允许的指针移动距离
const DRAG_ACTIVATION_DISTANCE_PX = 6;

// 页面拖拽仅排除分类分页容器，保留内部列表自动滚动
const PAGE_AUTO_SCROLL_OPTIONS = {
  /** 判断当前滚动祖先是否允许由 dnd-kit 自动滚动。 */
  canScroll(element: Element) {
    return !element.hasAttribute("data-category-page-scroll");
  },
} satisfies AutoScrollOptions;

// 页面拖拽上下文默认值
const PageDndContext = createContext<PageDndContextValue>({
  activeItem: null,
});

/** 读取当前页面拖拽会话。 */
// eslint-disable-next-line react-refresh/only-export-components
export function usePageDnd() {
  return useContext(PageDndContext);
}

/** 创建仅在目标或语义投放区域变化时更新的移动标识。 */
function createDragMoveKey(
  item: DragItem,
  moveTarget: PageCollisionTarget
) {
  // 当前目标内由业务定义的语义投放区域
  const targetMoveKey =
    moveTarget.targetData.getDragMoveKey?.(item, moveTarget.context) ??
    "target";
  return createDndId("drag-move", moveTarget.id, targetMoveKey);
}

/** 为新标签页提供唯一的 dnd-kit 拖拽生命周期。 */
export default function PageDndProvider({ children }: PageDndProviderProps) {
  // 当前用于渲染拖拽预览的会话数据
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  // 不触发移动重渲染的当前拖拽会话
  const activeItemRef = useRef<DragItem | null>(null);
  // 当前拖拽源的取消处理器
  const sourceDataRef = useRef<DndSourceData | null>(null);
  // 最近一次已经执行的语义移动标识
  const lastDragMoveKeyRef = useRef<string | null>(null);
  // 当前帧等待执行的最后一次语义移动
  const pendingDragMoveRef = useRef<PendingDragMove | null>(null);
  // 合并高频指针移动的动画帧句柄
  const dragMoveFrameRef = useRef<number | null>(null);
  // 当前组件生命周期内稳定的碰撞检测运行时
  const [collisionRuntime] = useState(createPageCollisionRuntime);
  // 页面统一使用的指针传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX },
    })
  );

  /** 取消尚未执行的拖拽移动任务。 */
  function cancelPendingDragMove() {
    if (dragMoveFrameRef.current !== null) {
      window.cancelAnimationFrame(dragMoveFrameRef.current);
      dragMoveFrameRef.current = null;
    }
    pendingDragMoveRef.current = null;
  }

  /** 清理当前拖拽移动的去重与帧合并状态。 */
  function resetDragMoveDispatch() {
    cancelPendingDragMove();
    lastDragMoveKeyRef.current = null;
  }

  /** 在下一动画帧执行最后一个发生语义变化的悬停行为。 */
  function scheduleDragMove(pendingDragMove: PendingDragMove) {
    if (pendingDragMove.key === lastDragMoveKeyRef.current) {
      cancelPendingDragMove();
      return;
    }
    pendingDragMoveRef.current = pendingDragMove;
    if (dragMoveFrameRef.current !== null) {
      return;
    }
    dragMoveFrameRef.current = window.requestAnimationFrame(() => {
      dragMoveFrameRef.current = null;
      // 当前帧最终需要执行的悬停行为
      const nextDragMove = pendingDragMoveRef.current;
      pendingDragMoveRef.current = null;
      if (!nextDragMove || nextDragMove.key === lastDragMoveKeyRef.current) {
        return;
      }
      lastDragMoveKeyRef.current = nextDragMove.key;
      nextDragMove.targetData.onDragMove?.(
        nextDragMove.item,
        nextDragMove.context
      );
    });
  }

  /** 开始页面拖拽并保存稳定的会话快照。 */
  function handleDragStart(event: DragStartEvent) {
    // 当前拖拽源携带的数据
    const sourceData = event.active.data.current;
    if (!isDndSourceData(sourceData)) {
      return;
    }
    // 当前拖拽项目的稳定会话数据
    const item = sourceData.createDragItem();
    collisionRuntime.beginDrag(item.type);
    resetDragMoveDispatch();
    sourceDataRef.current = sourceData;
    activeItemRef.current = item;
    document.documentElement.dataset.pageDragging = "true";
    setActiveItem(item);
  }

  /** 持续分发当前投放目标的悬停行为。 */
  function handleDragMove() {
    // 当前稳定拖拽会话
    const item = activeItemRef.current;
    if (!item) {
      return;
    }
    // 碰撞函数刚刚确定的实时业务目标
    const moveTarget = collisionRuntime.getMoveTarget();
    if (!moveTarget) {
      resetDragMoveDispatch();
      return;
    }
    // 当前目标与语义投放区域共同组成的移动标识
    const dragMoveKey = createDragMoveKey(item, moveTarget);
    scheduleDragMove({
      key: dragMoveKey,
      item,
      targetData: moveTarget.targetData,
      context: moveTarget.context,
    });
  }

  /** 清理拖拽会话并按需恢复临时预览。 */
  function finishDrag(shouldCancel: boolean) {
    resetDragMoveDispatch();
    collisionRuntime.reset();
    delete document.documentElement.dataset.pageDragging;
    if (shouldCancel) {
      sourceDataRef.current?.onCancel?.();
    }
    sourceDataRef.current = null;
    activeItemRef.current = null;
    setActiveItem(null);
  }

  /** 将拖拽结果提交给唯一命中的投放目标。 */
  function handleDragEnd() {
    // 当前稳定拖拽会话
    const item = activeItemRef.current;
    if (!item) {
      finishDrag(false);
      return;
    }
    // 最终坐标对应的实时业务目标
    const moveTarget = collisionRuntime.getMoveTarget();
    if (!moveTarget) {
      finishDrag(true);
      return;
    }
    cancelPendingDragMove();
    moveTarget.targetData.onDragMove?.(item, moveTarget.context);
    moveTarget.targetData.onDrop(item, moveTarget.context);
    finishDrag(false);
  }

  /** 取消拖拽并恢复当前拖拽源的临时状态。 */
  function handleDragCancel() {
    finishDrag(true);
  }

  useEffect(() => {
    if (activeItem?.type !== DRAG_ITEM_TYPE.DOCK_LINK) {
      return;
    }
    // Dock 排序期间需要强制使用抓取手型的文档根节点
    const documentElement = document.documentElement;
    documentElement.dataset.dockDragging = "true";
    /** 清理 Dock 排序结束或组件卸载后的全局指针状态。 */
    return () => {
      delete documentElement.dataset.dockDragging;
    };
  }, [activeItem]);

  useEffect(() => {
    /** 清理组件卸载时可能残留的页面拖拽性能标识。 */
    return () => {
      delete document.documentElement.dataset.pageDragging;
      collisionRuntime.reset();
    };
  }, [collisionRuntime]);

  return (
    <PageDndContext.Provider value={{ activeItem }}>
      <DndContext
        sensors={sensors}
        autoScroll={PAGE_AUTO_SCROLL_OPTIONS}
        collisionDetection={collisionRuntime.collisionDetection}
        measuring={{
          droppable: { strategy: MeasuringStrategy.BeforeDragging },
        }}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={null} zIndex={70}>
          {activeItem ? <LinkDragPreview item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </PageDndContext.Provider>
  );
}
