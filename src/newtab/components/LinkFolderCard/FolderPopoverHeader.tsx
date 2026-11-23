import {
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";

// 文件夹名称最大字符数（与新建文件夹表单保持一致）
const FOLDER_NAME_MAX_LENGTH = 30;

/** 文件夹浮层头部暴露给父级浮层的按键处理句柄。 */
export interface FolderPopoverHeaderHandle {
  /** 在行内编辑状态下拦截 Escape，避免直接关闭整个浮层。 */
  handleEscapeKeyDown: () => boolean;
}

interface FolderPopoverHeaderProps {
  name: string;
  linkCount: number;
  headerRef: RefObject<FolderPopoverHeaderHandle | null>;
  onRename: (name: string) => Promise<void>;
  onAddLink: () => void;
  onDelete: () => void;
}

/** 渲染支持点击标题就地重命名与直接删除的文件夹浮层头部。 */
export default function FolderPopoverHeader({
  name,
  linkCount,
  headerRef,
  onRename,
  onAddLink,
  onDelete,
}: FolderPopoverHeaderProps) {
  // 浮层头部的本地化文案
  const { t } = useTranslation();
  // 是否处于标题行内编辑态
  const [isEditing, setIsEditing] = useState(false);
  // 编辑中的草稿名称
  const [draftName, setDraftName] = useState(name);
  // 输入法组合输入状态（避免选词回车误提交）
  const isComposingRef = useRef(false);
  // 当前编辑周期是否已结束（防止回车后卸载触发失焦重复提交）
  const hasFinishedEditRef = useRef(false);
  // 标题按钮引用，用于 Escape 取消后恢复键盘焦点
  const titleButtonRef = useRef<HTMLButtonElement>(null);

  /** 进入标题行内编辑态并同步当前名称。 */
  const startEditing = () => {
    hasFinishedEditRef.current = false;
    isComposingRef.current = false;
    setDraftName(name);
    setIsEditing(true);
  };

  /** 结束编辑并按需提交重命名。 */
  const commitEdit = () => {
    if (hasFinishedEditRef.current) {
      return;
    }
    hasFinishedEditRef.current = true;
    isComposingRef.current = false;
    setIsEditing(false);

    // 去除首尾空格后的目标名称
    const trimmedName = draftName.trim();
    if (!trimmedName || trimmedName === name) {
      setDraftName(name);
      return;
    }
    void onRename(trimmedName);
  };

  /** 取消行内编辑并还原原始名称与按钮焦点。 */
  const cancelEdit = () => {
    if (hasFinishedEditRef.current) {
      return;
    }
    hasFinishedEditRef.current = true;
    isComposingRef.current = false;
    setIsEditing(false);
    setDraftName(name);
    window.requestAnimationFrame(() => {
      titleButtonRef.current?.focus();
    });
  };

  useImperativeHandle(headerRef, () => ({
    /** 处理浮层捕获的 Escape 按键：返回 true 表示已拦截，阻止浮层关闭。 */
    handleEscapeKeyDown() {
      if (!isEditing) {
        return false;
      }
      if (isComposingRef.current) {
        return true;
      }
      cancelEdit();
      return true;
    },
  }));

  /** 处理输入框内的回车提交。 */
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Enter" &&
      !isComposingRef.current &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      commitEdit();
    }
  };

  return (
    <div className="mb-3 flex h-9 items-center justify-between gap-2 border-b border-white/10 pb-3">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {isEditing ? (
          <input
            type="text"
            value={draftName}
            maxLength={FOLDER_NAME_MAX_LENGTH}
            autoFocus
            aria-label={t("linkGroup.name")}
            placeholder={name}
            onChange={(event) => setDraftName(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onBlur={commitEdit}
            onKeyDown={handleInputKeyDown}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            className="-ml-1.5 h-7 min-w-0 flex-1 rounded-md border border-blue-300/60 bg-white/[0.08] px-1.5 text-sm font-semibold text-white outline-none ring-2 ring-blue-300/20 placeholder:text-white/35"
          />
        ) : (
          <button
            ref={titleButtonRef}
            type="button"
            onClick={startEditing}
            title={t("linkGroup.editTitle")}
            aria-label={t("linkGroup.editTitle")}
            className="group/title -ml-1.5 flex h-7 min-w-0 max-w-full cursor-text items-center gap-1.5 rounded-md px-1.5 text-left text-sm font-semibold text-white/95 outline-none transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-blue-200/70"
          >
            <span className="truncate">{name}</span>
            <Pencil
              size={12}
              aria-hidden="true"
              className="shrink-0 text-white/35 transition-colors group-hover/title:text-white/80 group-focus-visible/title:text-white/80"
            />
          </button>
        )}
        <span className="shrink-0 rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[11px] font-medium leading-none text-white/50 tabular-nums">
          {linkCount}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {linkCount > 0 ? (
          <button
            type="button"
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-white/60 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-200/70"
            onClick={onAddLink}
            title={t("linkGroup.addLink")}
            aria-label={t("linkGroup.addLink")}
          >
            <Plus size={16} />
          </button>
        ) : null}
        <button
          type="button"
          className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-white/55 outline-none transition-colors hover:bg-red-500/15 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-300/60"
          onClick={onDelete}
          title={t("linkGroup.confirmDelete")}
          aria-label={t("linkGroup.confirmDelete")}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
