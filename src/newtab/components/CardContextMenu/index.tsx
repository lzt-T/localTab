import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  Copy,
  Edit,
  ExternalLink,
  FolderInput,
  FolderOpen,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CategoryInfo, Link, LinkGroupInfo } from "@/type/db";

interface ContextMenuSubItem {
  id: string;
  label: string;
  onSelect: () => void;
}

interface ContextMenuAction {
  id: string;
  label: string;
  icon: ReactNode;
  danger?: boolean;
  separatorBefore?: boolean;
  onSelect?: () => void;
  children?: ContextMenuSubItem[];
}

interface ContextMenuState {
  x: number;
  y: number;
  actions: ContextMenuAction[];
}

interface CardContextMenuContextValue {
  openLinkMenu: (
    x: number,
    y: number,
    link: Link,
    categoryId: string
  ) => void;
  openFolderMenu: (
    x: number,
    y: number,
    linkGroup: LinkGroupInfo,
    categoryId: string,
    openFolder: () => void
  ) => void;
  openDockLinkMenu: (x: number, y: number, link: Link) => void;
}

interface CardContextMenuProviderProps {
  children: ReactNode;
  categories: CategoryInfo[];
  dockLinks: Link[];
  onOpenLink: (url: string) => void;
  onEditLink: (linkId: string) => void;
  onPinDockLink: (linkId: string) => Promise<void>;
  onUnpinDockLink: (linkId: string) => Promise<void>;
  onMoveLink: (
    linkId: string,
    targetParentId: string,
    targetIndex: number
  ) => Promise<void>;
  onMoveCategoryItem: (
    categoryId: string,
    itemId: string,
    targetIndex: number
  ) => Promise<void>;
  onDeleteLink: (linkId: string) => void;
  onOpenAddLink: (parentId: string) => void;
  onDeleteFolder: (linkGroup: LinkGroupInfo) => void;
}

// 视口安全边距
const MENU_VIEWPORT_PADDING = 12;

const NOOP_MENU_CONTEXT: CardContextMenuContextValue = {
  openLinkMenu: () => undefined,
  openFolderMenu: () => undefined,
  openDockLinkMenu: () => undefined,
};

const CardContextMenuContext =
  createContext<CardContextMenuContextValue>(NOOP_MENU_CONTEXT);

/** 获取稳定的卡片/文件夹/Dock 右键菜单操作器。 */
// eslint-disable-next-line react-refresh/only-export-components
export function useCardContextMenu() {
  return useContext(CardContextMenuContext);
}

/** 复制网址链接并给出反馈提示。 */
async function copyUrlToClipboard(
  url: string,
  successText: string,
  failedText: string
) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success(successText);
  } catch {
    toast.error(failedText);
  }
}

/** 为首页网址卡片、文件夹和 Dock 图标提供统一、轻量的全局右键菜单。 */
export function CardContextMenuProvider({
  children,
  ...props
}: CardContextMenuProviderProps) {
  const { t } = useTranslation();
  const [menuState, setMenuState] = useState<ContextMenuState | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });
  const [expandedSubmenuId, setExpandedSubmenuId] = useState<string | null>(
    null
  );
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const menuRef = useRef<HTMLDivElement>(null);

  // 通过 ref 读取最新数据和回调，保持 context 值引用恒定，不破坏卡片 memo
  const latestPropsRef = useRef(props);
  useEffect(() => {
    latestPropsRef.current = props;
  });

  const closeMenu = useCallback(() => {
    setMenuState(null);
    setExpandedSubmenuId(null);
    setFocusedIndex(-1);
  }, []);

  const openMenuWithActions = useCallback(
    (x: number, y: number, actions: ContextMenuAction[]) => {
      setExpandedSubmenuId(null);
      setFocusedIndex(-1);
      setPosition({ left: x, top: y });
      setMenuState({ x, y, actions });
    },
    []
  );

  const openLinkMenu = useCallback(
    (x: number, y: number, link: Link, categoryId: string) => {
      const {
        categories,
        dockLinks,
        onOpenLink,
        onEditLink,
        onPinDockLink,
        onUnpinDockLink,
        onMoveLink,
        onDeleteLink,
      } = latestPropsRef.current;

      const isPinnedToDock = dockLinks.some(
        (dockLink) => dockLink.id === link.id
      );
      const otherCategories = categories.filter(
        (category) => category.id !== categoryId
      );

      const actions: ContextMenuAction[] = [
        {
          id: "open",
          label: t("contextMenu.openInNewTab"),
          icon: <ExternalLink size={14} />,
          onSelect: () => onOpenLink(link.url),
        },
        {
          id: "copy",
          label: t("contextMenu.copyUrl"),
          icon: <Copy size={14} />,
          onSelect: () => {
            void copyUrlToClipboard(
              link.url,
              t("contextMenu.copySuccess"),
              t("contextMenu.copyFailed")
            );
          },
        },
        {
          id: "edit",
          label: t("common.edit"),
          icon: <Edit size={14} />,
          separatorBefore: true,
          onSelect: () => onEditLink(link.id),
        },
        isPinnedToDock
          ? {
              id: "unpin-dock",
              label: t("contextMenu.unpinFromDock"),
              icon: <PinOff size={14} />,
              onSelect: () => void onUnpinDockLink(link.id),
            }
          : {
              id: "pin-dock",
              label: t("contextMenu.pinToDock"),
              icon: <Pin size={14} />,
              onSelect: () => void onPinDockLink(link.id),
            },
      ];

      if (otherCategories.length > 0) {
        actions.push({
          id: "move-category",
          label: t("contextMenu.moveToCategory"),
          icon: <FolderInput size={14} />,
          children: otherCategories.map((targetCategory) => ({
            id: targetCategory.id,
            label: targetCategory.name,
            onSelect: () =>
              void onMoveLink(
                link.id,
                targetCategory.id,
                targetCategory.items.length
              ),
          })),
        });
      }

      actions.push({
        id: "delete",
        label: t("common.delete"),
        icon: <Trash2 size={14} />,
        danger: true,
        separatorBefore: true,
        onSelect: () => onDeleteLink(link.id),
      });

      openMenuWithActions(x, y, actions);
    },
    [openMenuWithActions, t]
  );

  const openFolderMenu = useCallback(
    (
      x: number,
      y: number,
      linkGroup: LinkGroupInfo,
      categoryId: string,
      openFolder: () => void
    ) => {
      const {
        categories,
        onOpenAddLink,
        onMoveCategoryItem,
        onDeleteFolder,
      } = latestPropsRef.current;

      const otherCategories = categories.filter(
        (category) => category.id !== categoryId
      );

      const actions: ContextMenuAction[] = [
        {
          id: "open-folder",
          label: t("contextMenu.openFolder"),
          icon: <FolderOpen size={14} />,
          onSelect: openFolder,
        },
        {
          id: "add-link",
          label: t("linkGroup.addLink"),
          icon: <Plus size={14} />,
          onSelect: () => onOpenAddLink(linkGroup.id),
        },
      ];

      if (otherCategories.length > 0) {
        actions.push({
          id: "move-category",
          label: t("contextMenu.moveToCategory"),
          icon: <FolderInput size={14} />,
          separatorBefore: true,
          children: otherCategories.map((targetCategory) => ({
            id: targetCategory.id,
            label: targetCategory.name,
            onSelect: () =>
              void onMoveCategoryItem(
                targetCategory.id,
                linkGroup.id,
                targetCategory.items.length
              ),
          })),
        });
      }

      actions.push({
        id: "delete",
        label: t("linkGroup.confirmDelete"),
        icon: <Trash2 size={14} />,
        danger: true,
        separatorBefore: true,
        onSelect: () => onDeleteFolder(linkGroup),
      });

      openMenuWithActions(x, y, actions);
    },
    [openMenuWithActions, t]
  );

  const openDockLinkMenu = useCallback(
    (x: number, y: number, link: Link) => {
      const { onOpenLink, onUnpinDockLink } = latestPropsRef.current;

      openMenuWithActions(x, y, [
        {
          id: "open",
          label: t("contextMenu.openInNewTab"),
          icon: <ExternalLink size={14} />,
          onSelect: () => onOpenLink(link.url),
        },
        {
          id: "copy",
          label: t("contextMenu.copyUrl"),
          icon: <Copy size={14} />,
          onSelect: () => {
            void copyUrlToClipboard(
              link.url,
              t("contextMenu.copySuccess"),
              t("contextMenu.copyFailed")
            );
          },
        },
        {
          id: "unpin-dock",
          label: t("contextMenu.unpinFromDock"),
          icon: <PinOff size={14} />,
          separatorBefore: true,
          onSelect: () => void onUnpinDockLink(link.id),
        },
      ]);
    },
    [openMenuWithActions, t]
  );

  // 根据视口尺寸矫正菜单坐标，避免贴边裁剪
  useLayoutEffect(() => {
    if (!menuState || !menuRef.current) {
      return;
    }
    const rect = menuRef.current.getBoundingClientRect();
    const maxLeft = Math.max(
      MENU_VIEWPORT_PADDING,
      window.innerWidth - rect.width - MENU_VIEWPORT_PADDING
    );
    const maxTop = Math.max(
      MENU_VIEWPORT_PADDING,
      window.innerHeight - rect.height - MENU_VIEWPORT_PADDING
    );
    const clampedLeft = Math.min(Math.max(MENU_VIEWPORT_PADDING, menuState.x), maxLeft);
    const clampedTop = Math.min(Math.max(MENU_VIEWPORT_PADDING, menuState.y), maxTop);
    setPosition({ left: clampedLeft, top: clampedTop });
  }, [menuState]);

  // 监听全局点击、滚轮与键盘事件，及时关闭或操作菜单
  useEffect(() => {
    if (!menuState) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      closeMenu();
    };

    const handleWheel = () => {
      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % menuState.actions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prev) =>
          prev <= 0 ? menuState.actions.length - 1 : prev - 1
        );
        return;
      }
      if (event.key === "Enter" && focusedIndex >= 0) {
        event.preventDefault();
        const action = menuState.actions[focusedIndex];
        if (!action) {
          return;
        }
        if (action.children) {
          setExpandedSubmenuId((prev) =>
            prev === action.id ? null : action.id
          );
          return;
        }
        action.onSelect?.();
        closeMenu();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, focusedIndex, menuState]);

  const contextValue = useMemo<CardContextMenuContextValue>(
    () => ({
      openLinkMenu,
      openFolderMenu,
      openDockLinkMenu,
    }),
    [openDockLinkMenu, openFolderMenu, openLinkMenu]
  );

  // 判断子菜单是否应当向左展开，避免超出视口右侧
  const shouldOpenSubmenuLeft =
    position.left + 210 + 170 > window.innerWidth - MENU_VIEWPORT_PADDING;

  return (
    <CardContextMenuContext.Provider value={contextValue}>
      {children}
      {menuState
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ left: position.left, top: position.top }}
              className="glass-style-popover fixed z-[80] min-w-[196px] rounded-xl p-1.5 text-sm shadow-2xl shadow-black/45 animate-in fade-in-0 zoom-in-95 duration-100"
              onContextMenu={(event) => event.preventDefault()}
            >
              {menuState.actions.map((action, index) => {
                const isSubmenuOpen = expandedSubmenuId === action.id;
                return (
                  <div key={action.id} className="relative">
                    {action.separatorBefore && (
                      <div
                        className="my-1 h-px bg-[var(--surface-divider)]"
                        role="separator"
                      />
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      aria-haspopup={action.children ? "menu" : undefined}
                      aria-expanded={action.children ? isSubmenuOpen : undefined}
                      onMouseEnter={() => {
                        setFocusedIndex(index);
                        setExpandedSubmenuId(action.children ? action.id : null);
                      }}
                      onClick={() => {
                        if (action.children) {
                          setExpandedSubmenuId((prev) =>
                            prev === action.id ? null : action.id
                          );
                          return;
                        }
                        action.onSelect?.();
                        closeMenu();
                      }}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] outline-none transition-colors",
                        action.danger
                          ? "text-red-300 hover:bg-red-500/18 hover:text-red-200"
                          : "text-[var(--surface-text-secondary)] hover:bg-[var(--surface-hover-strong)] hover:text-[var(--surface-text)]",
                        focusedIndex === index &&
                          (action.danger
                            ? "bg-red-500/18 text-red-200"
                            : "bg-[var(--surface-hover-strong)] text-[var(--surface-text)]")
                      )}
                    >
                      <span className="shrink-0 opacity-85">{action.icon}</span>
                      <span className="min-w-0 flex-1 truncate">
                        {action.label}
                      </span>
                      {action.children && (
                        <ChevronRight size={14} className="shrink-0 opacity-65" />
                      )}
                    </button>

                    {action.children && isSubmenuOpen && (
                      <div
                        role="menu"
                        className={cn(
                          "glass-style-popover absolute top-0 z-[81] max-h-60 min-w-[164px] max-w-[220px] overflow-y-auto rounded-xl p-1.5 shadow-2xl shadow-black/45",
                          shouldOpenSubmenuLeft
                            ? "right-[calc(100%+4px)]"
                            : "left-[calc(100%+4px)]"
                        )}
                      >
                        {action.children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              child.onSelect();
                              closeMenu();
                            }}
                            className="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-2 text-left text-[13px] text-[var(--surface-text-secondary)] outline-none transition-colors hover:bg-[var(--surface-hover-strong)] hover:text-[var(--surface-text)]"
                          >
                            <span className="truncate">{child.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </CardContextMenuContext.Provider>
  );
}
