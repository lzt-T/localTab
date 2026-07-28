import {
  closestCenter,
  type ClientRect,
  type Collision,
  type CollisionDescriptor,
  type CollisionDetection,
  type DroppableContainer,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  DRAG_ITEM_TYPE,
  DROP_TARGET_PRIORITY_BY_TYPE,
  DROP_TARGET_TYPE,
  isDndTargetData,
  type DragItemType,
  type DragMoveContext,
  type DndTargetData,
} from "@/newtab/drag-and-drop";

// 最近一次有效碰撞的内部快照
export interface PageCollisionTarget {
  id: UniqueIdentifier;
  targetData: DndTargetData;
  context: DragMoveContext;
}

// 页面碰撞检测对拖拽生命周期暴露的稳定接口
export interface PageCollisionRuntime {
  beginDrag: (itemType: DragItemType) => void;
  collisionDetection: CollisionDetection;
  getMoveTarget: () => PageCollisionTarget | null;
  reset: () => void;
}

/** 判断投放容器是否接受当前拖拽类型。 */
function acceptsDragItem(
  container: DroppableContainer,
  itemType: DragItemType
): boolean {
  // 投放容器携带的业务数据
  const targetData = container.data.current;
  return isDndTargetData(targetData) && targetData.accepts.includes(itemType);
}

/** 读取投放目标的业务优先级。 */
function getTargetPriority(container: DroppableContainer): number {
  // 投放容器携带的业务数据
  const targetData = container.data.current;
  return isDndTargetData(targetData)
    ? targetData.priority ?? DROP_TARGET_PRIORITY_BY_TYPE[targetData.type]
    : 0;
}

/** 从指针下的 DOM 层级收集已注册且兼容的投放目标。 */
function getHitContainers(
  coordinates: { x: number; y: number },
  containerByElement: WeakMap<Element, DroppableContainer>,
  itemType: DragItemType
): DroppableContainer[] {
  // 已按 DOM 命中顺序收集的兼容目标
  const hitContainers: DroppableContainer[] = [];
  // 防止同一投放目标由多个子元素重复收集
  const collectedIds = new Set<UniqueIdentifier>();
  // 当前指针下从前景到背景的元素
  const hitElements = document.elementsFromPoint(coordinates.x, coordinates.y);

  hitElements.forEach((hitElement) => {
    // 从实际命中元素向上查找注册投放节点
    let currentElement: Element | null = hitElement;
    while (currentElement) {
      // 当前元素对应的投放容器
      const container = containerByElement.get(currentElement);
      if (
        container &&
        !collectedIds.has(container.id) &&
        acceptsDragItem(container, itemType)
      ) {
        collectedIds.add(container.id);
        hitContainers.push(container);
      }
      currentElement = currentElement.parentElement;
    }
  });

  return hitContainers;
}

/** 从兼容目标中选择业务优先级最高的目标。 */
function getHighestPriorityContainer(
  containers: DroppableContainer[]
): DroppableContainer | null {
  // 当前已经选中的最高优先级目标
  let selectedContainer: DroppableContainer | null = null;
  // 当前最高业务优先级
  let selectedPriority = Number.NEGATIVE_INFINITY;

  containers.forEach((container) => {
    // 当前目标的业务优先级
    const priority = getTargetPriority(container);
    if (priority > selectedPriority) {
      selectedContainer = container;
      selectedPriority = priority;
    }
  });

  return selectedContainer;
}

/** 判断候选目标是否属于指定投放类型。 */
function hasTargetType(
  containers: DroppableContainer[],
  targetType: (typeof DROP_TARGET_TYPE)[keyof typeof DROP_TARGET_TYPE]
): boolean {
  return containers.some((container) => {
    // 候选目标携带的业务数据
    const targetData = container.data.current;
    return isDndTargetData(targetData) && targetData.type === targetType;
  });
}

/** 创建包含 dnd-kit 标准数据的单一碰撞结果。 */
function createCollision(
  container: DroppableContainer,
  value: number
): CollisionDescriptor {
  return {
    id: container.id,
    data: {
      droppableContainer: container,
      value,
    },
  };
}

/** 创建基于 DOM 实际命中的页面碰撞检测运行时。 */
export function createPageCollisionRuntime(): PageCollisionRuntime {
  // 当前拖拽会话中不受源节点卸载影响的项目类型
  let activeItemType: DragItemType | null = null;
  // 当前投放节点到 dnd-kit 容器的弱引用索引
  let containerByElement = new WeakMap<Element, DroppableContainer>();
  // 上一次建立节点索引时的投放容器列表
  let indexedContainers: DroppableContainer[] | null = null;
  // 最近一次有效碰撞及其实时坐标和矩形
  let lastCollision: PageCollisionTarget | null = null;
  // 当前同步渲染周期内最近一次碰撞的拖拽源
  let cachedActiveId: UniqueIdentifier | null = null;
  // 当前同步渲染周期内最近一次碰撞的横坐标
  let cachedPointerX: number | null = null;
  // 当前同步渲染周期内最近一次碰撞的纵坐标
  let cachedPointerY: number | null = null;
  // 当前同步渲染周期内最近一次碰撞的容器列表
  let cachedContainers: DroppableContainer[] | null = null;
  // 当前同步渲染周期内可复用的碰撞结果
  let cachedCollisions: Collision[] | null = null;
  // 防止旧微任务清除新碰撞缓存的版本号
  let collisionCacheVersion = 0;

  /** 保存当前拖拽会话用于目标过滤的稳定项目类型。 */
  function beginDrag(itemType: DragItemType) {
    activeItemType = itemType;
  }

  /** 清除只用于合并 React 同步重复渲染的碰撞缓存。 */
  function clearCollisionCache() {
    cachedActiveId = null;
    cachedPointerX = null;
    cachedPointerY = null;
    cachedContainers = null;
    cachedCollisions = null;
  }

  /** 读取相同输入在当前同步渲染周期内已有的碰撞结果。 */
  function getCachedCollisions(
    activeId: UniqueIdentifier,
    coordinates: { x: number; y: number },
    containers: DroppableContainer[]
  ): Collision[] | null {
    return cachedActiveId === activeId &&
      cachedPointerX === coordinates.x &&
      cachedPointerY === coordinates.y &&
      cachedContainers === containers
      ? cachedCollisions
      : null;
  }

  /** 缓存碰撞结果直至当前同步渲染周期结束。 */
  function cacheCollisions(
    activeId: UniqueIdentifier,
    coordinates: { x: number; y: number },
    containers: DroppableContainer[],
    collisions: Collision[]
  ): Collision[] {
    cachedActiveId = activeId;
    cachedPointerX = coordinates.x;
    cachedPointerY = coordinates.y;
    cachedContainers = containers;
    cachedCollisions = collisions;
    collisionCacheVersion += 1;
    // 当前缓存对应的版本号
    const cacheVersion = collisionCacheVersion;
    queueMicrotask(() => {
      if (cacheVersion === collisionCacheVersion) {
        clearCollisionCache();
      }
    });
    return collisions;
  }

  /** 在投放目标注册发生变化时重建 DOM 节点索引。 */
  function updateContainerIndex(containers: DroppableContainer[]) {
    if (containers === indexedContainers) {
      return;
    }
    containerByElement = new WeakMap<Element, DroppableContainer>();
    containers.forEach((container) => {
      // 当前投放容器注册的 DOM 节点
      const node = container.node.current;
      if (node) {
        containerByElement.set(node, container);
      }
    });
    indexedContainers = containers;
  }

  /** 实时测量最终候选并保存移动上下文。 */
  function finalizeCollision(
    container: DroppableContainer,
    coordinates: { x: number; y: number },
    value: number
  ): CollisionDescriptor[] {
    // 最终候选目标的实时视口矩形
    const targetRect: ClientRect = container.node.current!.getBoundingClientRect();
    // 最终候选目标携带的业务数据
    const targetData = container.data.current as DndTargetData;
    container.rect.current = targetRect;
    lastCollision = {
      id: container.id,
      targetData,
      context: { coordinates, targetRect },
    };
    return [createCollision(container, value)];
  }

  /** 按 DOM 命中、兼容类型和业务优先级选择唯一目标。 */
  const collisionDetection: CollisionDetection = (args) => {
    // 当前碰撞计算使用的稳定拖拽类型快照
    const itemType = activeItemType;
    // dnd-kit 已计算的当前实时指针坐标
    const coordinates = args.pointerCoordinates;
    if (!itemType || !coordinates) {
      lastCollision = null;
      return [];
    }

    updateContainerIndex(args.droppableContainers);
    // StrictMode 同步重复渲染时可直接复用的碰撞结果
    const cachedResult = getCachedCollisions(
      args.active.id,
      coordinates,
      args.droppableContainers
    );
    if (cachedResult) {
      return cachedResult;
    }
    // 指针下与当前拖拽类型兼容的少量投放目标
    const hitContainers = getHitContainers(
      coordinates,
      containerByElement,
      itemType
    );
    // 垃圾桶始终覆盖其他投放意图
    const trashContainer = hitContainers.find((container) => {
      // 候选目标携带的业务数据
      const targetData = container.data.current;
      return (
        isDndTargetData(targetData) &&
        targetData.type === DROP_TARGET_TYPE.TRASH
      );
    });
    if (trashContainer) {
      return cacheCollisions(
        args.active.id,
        coordinates,
        args.droppableContainers,
        finalizeCollision(
          trashContainer,
          coordinates,
          DROP_TARGET_PRIORITY_BY_TYPE[DROP_TARGET_TYPE.TRASH]
        )
      );
    }

    if (itemType === DRAG_ITEM_TYPE.DOCK_LINK) {
      if (!hasTargetType(hitContainers, DROP_TARGET_TYPE.DOCK_AREA)) {
        lastCollision = null;
        return [];
      }
      // Dock 内参与横向空隙排序的少量网址目标
      const dockLinkContainers = args.droppableContainers.filter(
        (container) => {
          // Dock 目标携带的业务数据
          const targetData = container.data.current;
          return (
            isDndTargetData(targetData) &&
            targetData.type === DROP_TARGET_TYPE.DOCK_LINK &&
            targetData.accepts.includes(itemType)
          );
        }
      );
      // Dock 横向最近中心目标
      const dockCollision = closestCenter({
        ...args,
        droppableContainers: dockLinkContainers,
      })[0];
      // Dock 最近中心对应的投放容器
      const dockContainer = dockCollision?.data?.droppableContainer;
      if (!dockContainer) {
        lastCollision = null;
        return [];
      }
      return cacheCollisions(
        args.active.id,
        coordinates,
        args.droppableContainers,
        finalizeCollision(
          dockContainer,
          coordinates,
          dockCollision.data?.value ?? 0
        )
      );
    }

    // 按既有业务优先级选中的最终 DOM 命中目标
    const selectedContainer = getHighestPriorityContainer(hitContainers);
    if (!selectedContainer) {
      lastCollision = null;
      return [];
    }
    return cacheCollisions(
      args.active.id,
      coordinates,
      args.droppableContainers,
      finalizeCollision(
        selectedContainer,
        coordinates,
        getTargetPriority(selectedContainer)
      )
    );
  };

  /** 读取碰撞函数刚刚确定的实时业务目标。 */
  function getMoveTarget(): PageCollisionTarget | null {
    return lastCollision;
  }

  /** 清除拖拽会话结束后保留的碰撞快照。 */
  function reset() {
    activeItemType = null;
    lastCollision = null;
    collisionCacheVersion += 1;
    clearCollisionCache();
  }

  return {
    beginDrag,
    collisionDetection,
    getMoveTarget,
    reset,
  };
}
