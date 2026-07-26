import { useCallback } from "react";
import { FolderPlus, Link2, Plus, Trash2 } from "lucide-react";
import { useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import Setting from "@/newtab/components/Setting";
import {
  DRAG_ITEM_TYPE,
  type DragItem,
} from "@/newtab/drag-and-drop";

interface DockProps {
  onAddLink: () => void;
  onCreateFolder: () => void;
  onDropToTrash: (item: DragItem) => Promise<void>;
}

// Dock 中可点击操作的统一视觉样式
const DOCK_ACTION_CLASS =
  "flex size-11 cursor-pointer items-center justify-center rounded-xl text-white/65 outline-none transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/12 hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-white/60 motion-reduce:transform-none motion-reduce:transition-none";

/** 渲染页面底部的常用操作 Dock 与拖拽垃圾桶。 */
export default function Dock({
  onAddLink,
  onCreateFolder,
  onDropToTrash,
}: DockProps) {
  // Dock 文案的本地化工具
  const { t } = useTranslation();
  // 垃圾桶的拖拽状态与投放连接器
  const [{ canDrop, isOver }, drop] = useDrop<
    DragItem,
    void,
    { canDrop: boolean; isOver: boolean }
  >({
    accept: [
      DRAG_ITEM_TYPE.CATEGORY,
      DRAG_ITEM_TYPE.LINK,
      DRAG_ITEM_TYPE.LINK_GROUP,
    ],
    /** 在垃圾桶接收对象后请求删除。 */
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

  /** 将垃圾桶元素注册为投放目标。 */
  const connectTrashRef = useCallback(
    (node: HTMLDivElement | null) => {
      drop(node);
    },
    [drop]
  );

  return (
    <nav
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/15 bg-[rgba(20,22,26,0.72)] p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:bottom-6"
      aria-label={t("dock.navigation")}
    >
      <button
        type="button"
        className={DOCK_ACTION_CLASS}
        onClick={onAddLink}
        title={t("link.addAction")}
        aria-label={t("link.addAction")}
      >
        <span className="relative">
          <Link2 size={20} />
          <Plus
            size={10}
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
        <FolderPlus size={20} />
      </button>
      <Setting triggerClassName={DOCK_ACTION_CLASS} />

      <span
        className="mx-1 h-8 w-px bg-white/15"
        aria-hidden="true"
      />

      <div
        ref={connectTrashRef}
        className={cn(
          "flex size-11 items-center justify-center rounded-xl border border-transparent text-white/55 outline-none transition-[background-color,border-color,color,transform,box-shadow] duration-200 motion-reduce:transform-none motion-reduce:transition-none",
          canDrop &&
            "scale-105 border-white/20 bg-white/10 text-white/85 shadow-[0_8px_24px_rgba(0,0,0,0.24)]",
          isOver &&
            "scale-110 border-red-300/45 bg-red-400/15 text-red-200 shadow-[0_10px_28px_rgba(248,113,113,0.16)]"
        )}
        role="img"
        title={isOver ? t("dock.releaseToDelete") : t("dock.trash")}
        aria-label={isOver ? t("dock.releaseToDelete") : t("dock.trash")}
      >
        <Trash2 size={20} />
      </div>
      <span className="sr-only" aria-live="polite">
        {isOver ? t("dock.releaseToDelete") : ""}
      </span>
    </nav>
  );
}
