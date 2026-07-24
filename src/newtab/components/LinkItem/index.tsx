import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit, Ellipsis, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Icon from "@/newtab/components/Icon";

interface LinkItemProps {
  link: {
    id?: string;
    url: string;
    icon: string;
    title: string;
    description: string;
  };
  handleEditClick?: (linkId: string) => void;
  handleDeleteClick?: (linkId: string) => void;
  handleSkipClick?: (url: string) => void;
}

/** 渲染可访问、编辑和删除的网址卡片。 */
export default function Index({
  link,
  handleEditClick,
  handleDeleteClick,
  handleSkipClick,
}: LinkItemProps) {
  // 卡片操作菜单的本地化文案
  const { t } = useTranslation();

  // 当前卡片操作菜单是否打开
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  // 外部图标加载失败时记录对应地址
  const [failedExternalIconUrl, setFailedExternalIconUrl] = useState("");

  // 鼠标移出后的延迟关闭计时器
  const actionMenuCloseTimerRef = useRef<number | null>(null);

  // 当前链接是否使用网络图标
  const isExternalIcon = link.icon.startsWith("http");

  // 网络图标可用时优先展示原始图标
  const shouldShowExternalIcon =
    isExternalIcon && failedExternalIconUrl !== link.icon;

  /** 清除操作菜单的延迟关闭任务。 */
  const clearActionMenuCloseTimer = useCallback(() => {
    if (actionMenuCloseTimerRef.current === null) {
      return;
    }

    window.clearTimeout(actionMenuCloseTimerRef.current);
    actionMenuCloseTimerRef.current = null;
  }, []);

  /** 鼠标离开卡片或菜单后延迟关闭操作菜单。 */
  const scheduleActionMenuClose = useCallback(() => {
    clearActionMenuCloseTimer();
    actionMenuCloseTimerRef.current = window.setTimeout(() => {
      setIsActionMenuOpen(false);
      actionMenuCloseTimerRef.current = null;
    }, 160);
  }, [clearActionMenuCloseTimer]);

  /** 同步操作菜单状态并取消待执行的关闭任务。 */
  const onActionMenuOpenChange = useCallback(
    (isOpen: boolean) => {
      clearActionMenuCloseTimer();
      setIsActionMenuOpen(isOpen);
    },
    [clearActionMenuCloseTimer]
  );

  /** 打开当前网址的编辑弹窗。 */
  const onEditClick = useCallback(
    () => {
      if (link.id && handleEditClick) {
        handleEditClick(link.id);
      }
    },
    [link.id, handleEditClick]
  );

  /** 打开当前网址的删除确认弹窗。 */
  const onDeleteClick = useCallback(
    () => {
      if (link.id && handleDeleteClick) {
        handleDeleteClick(link.id);
      }
    },
    [link.id, handleDeleteClick]
  );

  /** 在新标签页打开当前网址。 */
  const onSkipClick = useCallback(() => {
    if (link.url && handleSkipClick) {
      handleSkipClick(link.url);
    }
  }, [link.url, handleSkipClick]);

  /** 标记加载失败的网络图标并回退到默认图标。 */
  const onExternalIconError = () => {
    setFailedExternalIconUrl(link.icon);
  };

  useEffect(() => {
    return clearActionMenuCloseTimer;
  }, [clearActionMenuCloseTimer]);

  return (
    <div
      className="glass-style-border group/item relative flex h-28 cursor-pointer flex-col justify-center rounded-2xl p-4 shadow-lg shadow-black/10 transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-[rgba(68,70,74,0.66)] hover:shadow-xl hover:shadow-black/20 has-[[data-state=open]]:-translate-y-1 has-[[data-state=open]]:ring-2 has-[[data-state=open]]:ring-blue-200/50"
      onClick={onSkipClick}
      onMouseEnter={clearActionMenuCloseTimer}
      onMouseLeave={scheduleActionMenuClose}
    >
      {link.id && (handleEditClick || handleDeleteClick) && (
        <div
          className="absolute top-2 right-2 opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-within/item:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenu
            modal={false}
            open={isActionMenuOpen}
            onOpenChange={onActionMenuOpenChange}
          >
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-7 cursor-pointer items-center justify-center rounded-md text-white/70 outline-none transition-colors hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50 data-[state=open]:bg-white/20 data-[state=open]:text-white"
                aria-label={t("common.actions")}
              >
                <Ellipsis size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={8}
              className="glass-style-border min-w-24 border-white/15 bg-[rgba(24,26,30,0.98)] text-white shadow-2xl shadow-black/50 ring-1 ring-white/15 backdrop-blur-2xl"
              onClick={(event) => event.stopPropagation()}
              onMouseEnter={clearActionMenuCloseTimer}
              onMouseLeave={scheduleActionMenuClose}
            >
              {handleEditClick && (
                <DropdownMenuItem
                  className="cursor-pointer focus:bg-white/15 focus:text-white"
                  onSelect={onEditClick}
                >
                  <Edit />
                  {t("common.edit")}
                </DropdownMenuItem>
              )}

              {handleDeleteClick && (
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onSelect={onDeleteClick}
                >
                  <Trash2 />
                  {t("common.delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className="mb-1.5 flex h-8 items-center justify-center">
        {shouldShowExternalIcon ? (
          <img
            src={link.icon}
            alt={link.title}
            className="h-7 w-7 rounded object-contain"
            onError={onExternalIconError}
          />
        ) : (
          <Icon
            name={isExternalIcon ? "link" : link.icon || "link"}
            size={28}
            className="text-blue-200/90"
          />
        )}
      </div>
      <div
        className={cn(
          "w-full break-words text-center text-base font-medium leading-5 text-white/90",
          link.description ? "truncate" : "line-clamp-2"
        )}
        title={link.title}
      >
        {link.title}
      </div>
      {link.description && (
        <div
          className="mt-1 w-full truncate text-center text-xs leading-4 text-white/60"
          title={link.description}
        >
          {link.description}
        </div>
      )}
    </div>
  );
}
