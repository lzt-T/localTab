import React, { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import NavigationBar from "@/newtab/components/NavigationBar";
import { useData } from "@/newtab/useData";
import { useCategoryAction } from "@/hooks/useCategoryAction";
import AddCategory from "@/newtab/components/AddEditCategory";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import AddEditLink from "@/newtab/components/AddEditLink";
import { useLinkAction } from "@/hooks/useLinkAction";
import SearchInput from "@/newtab/components/SearchInput";
import CategoryPage from "@/newtab/components/CategoryPage";
import PageDndProvider from "@/newtab/components/PageDndProvider";
import { CardContextMenuProvider } from "@/newtab/components/CardContextMenu";
import DeleteConfirmDialog from "@/newtab/components/DeleteConfirmDialog";
import EditLinkGroup from "@/newtab/components/EditLinkGroup";
import { type SettingSection } from "@/newtab/components/Setting";
import Dock from "@/newtab/components/Dock";
import { useDockLinks } from "@/newtab/useDockLinks";
import { useLinkGroupAction } from "@/hooks/useLinkGroupAction";
import type { LinkGroupInfo } from "@/type/db";
import {
  DRAG_ITEM_TYPE,
  type CategoryDragItem,
  type LinkDragItem,
  type LinkGroupDragItem,
  type PageDragItem,
} from "@/newtab/drag-and-drop";

// 编程平滑滚动切页时屏蔽中间页交叉检测的最大时长
const PROGRAMMATIC_SCROLL_LOCK_MS = 650;

/** 渲染新标签页主应用。 */
const NewTabApp: React.FC = () => {
  // 页面本地化文案
  const { t } = useTranslation();
  // 新标签页数据和拖拽操作
  const {
    currentCategoryId,
    categories,
    backgroundStyle,
    changeCurrentCategory,
    refreshCategoriesData,
    updateCategoryOrder,
    moveLink,
    mergeLinks,
    moveCategoryItem,
    optimisticRenameLinkGroup,
    optimisticDeleteLink,
    optimisticDeleteLinkGroup,
    optimisticDeleteCategory,
  } = useData();
  // Dock 固定网址及其持久化操作
  const {
    dockLinks,
    pinDockLink,
    moveDockLink,
    unpinDockLink,
  } = useDockLinks(categories);
  // 分类编辑操作（传入内存数据以瞬开编辑弹窗）
  const {
    isOpen,
    mode,
    categoryId: editingCategoryId,
    initialData,
    onOpenAdd,
    onOpenEdit,
    onDeleteCategory,
    onClose,
    onSubmit,
  } = useCategoryAction(categories);

  // 网址编辑操作（传入内存数据以瞬开编辑抽屉）
  const {
    isOpen: isOpenLink,
    mode: modeLink,
    linkId: editingLinkId,
    initialData: initialDataLink,
    defaultParentId,
    onOpenAdd: onOpenAddLink,
    onOpenEdit: onOpenEditLink,
    onDeleteLink,
    onClose: onCloseLink,
    onSubmit: onSubmitLink,
  } = useLinkAction(categories);

  // 网址分组创建、重命名和删除操作
  const {
    isOpen: isCreateLinkGroupOpen,
    onOpenCreate: onOpenCreateLinkGroup,
    onClose: onCloseCreateLinkGroup,
    onCreate: onCreateLinkGroup,
    onRename: onRenameLinkGroup,
    onDelete: onDeleteLinkGroup,
  } = useLinkGroupAction();

  // 记录主动点击/拖拽切换时的目标分类，防止平滑滚动经过中间分类触发反向切换
  const [scrollTriggerToken, setScrollTriggerToken] = useState(0);
  const programmaticScrollTargetRef = useRef<{
    targetId: string;
    timer: number;
  } | null>(null);

  /** 主动切换到目标分类并加平滑滚动锁。 */
  const navigateToCategory = useCallback(
    (categoryId: string) => {
      if (programmaticScrollTargetRef.current) {
        window.clearTimeout(programmaticScrollTargetRef.current.timer);
      }
      const timer = window.setTimeout(() => {
        programmaticScrollTargetRef.current = null;
      }, PROGRAMMATIC_SCROLL_LOCK_MS);
      programmaticScrollTargetRef.current = { targetId: categoryId, timer };
      setScrollTriggerToken((prev) => prev + 1);
      changeCurrentCategory(categoryId);
    },
    [changeCurrentCategory]
  );

  /** 当前是否处于编程切页滚动期，若是则忽略中间分类交叉回调。 */
  const shouldIgnoreIntersection = useCallback(() => {
    return programmaticScrollTargetRef.current !== null;
  }, []);

  /** 当到达目标分类视口时释放编程滚动锁。 */
  const handleProgrammaticScrollSettled = useCallback((categoryId: string) => {
    const activeTarget = programmaticScrollTargetRef.current;
    if (activeTarget && activeTarget.targetId === categoryId) {
      window.clearTimeout(activeTarget.timer);
      programmaticScrollTargetRef.current = null;
    }
  }, []);

  /* 跳转链接 */
  const handleSkipClick = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  // 删除链接确认弹窗状态
  const [isDeleteLinkDialogOpen, setIsDeleteLinkDialogOpen] = useState(false);
  // 待删除的网址
  const [linkToDelete, setLinkToDelete] = useState<{ id: string; title: string } | null>(null);

  // 处理删除链接点击 - 打开确认弹窗
  const onDeleteLinkClick = useCallback((linkId: string) => {
    // 查找链接标题
    let linkTitle = "";
    for (const category of categories) {
      // 分类及其分组中的全部网址
      const categoryLinks = [
        ...category.links,
        ...category.linkGroups.flatMap((linkGroup) => linkGroup.links),
      ];
      // 待删除的网址
      const link = categoryLinks.find((item) => item.id === linkId);
      if (link) {
        linkTitle = link.title;
        break;
      }
    }
    setLinkToDelete({ id: linkId, title: linkTitle });
    setIsDeleteLinkDialogOpen(true);
  }, [categories]);

  // 确认删除链接（先乐观移除再异步落盘）
  const confirmDeleteLink = useCallback(async () => {
    const target = linkToDelete;
    setIsDeleteLinkDialogOpen(false);
    setLinkToDelete(null);
    if (!target) {
      return;
    }
    optimisticDeleteLink(target.id);
    toast.success(t("link.deleteSuccess"));
    try {
      await onDeleteLink(target.id);
    } catch (error) {
      console.error("删除网址失败:", error);
      await refreshCategoriesData();
    }
  }, [
    linkToDelete,
    onDeleteLink,
    optimisticDeleteLink,
    refreshCategoriesData,
    t,
  ]);

  // 删除网址分组确认弹窗状态
  const [isDeleteLinkGroupDialogOpen, setIsDeleteLinkGroupDialogOpen] =
    useState(false);
  // 待删除的网址分组
  const [linkGroupToDelete, setLinkGroupToDelete] =
    useState<LinkGroupInfo | null>(null);

  /** 打开网址分组删除确认弹窗。 */
  const onDeleteLinkGroupClick = useCallback((linkGroup: LinkGroupInfo) => {
    setLinkGroupToDelete(linkGroup);
    setIsDeleteLinkGroupDialogOpen(true);
  }, []);

  /** 乐观删除网址分组并异步持久化。 */
  const confirmDeleteLinkGroup = useCallback(async () => {
    const target = linkGroupToDelete;
    setIsDeleteLinkGroupDialogOpen(false);
    setLinkGroupToDelete(null);
    if (!target) {
      return;
    }
    optimisticDeleteLinkGroup(target.id);
    toast.success(t("linkGroup.deleteSuccess"));
    try {
      await onDeleteLinkGroup(target.id);
    } catch (error) {
      console.error("删除文件夹失败:", error);
      await refreshCategoriesData();
    }
  }, [
    linkGroupToDelete,
    onDeleteLinkGroup,
    optimisticDeleteLinkGroup,
    refreshCategoriesData,
    t,
  ]);

  /** 就地乐观重命名网址分组并异步落盘。 */
  const handleRenameLinkGroup = useCallback(
    async (linkGroupId: string, name: string) => {
      optimisticRenameLinkGroup(linkGroupId, name);
      toast.success(t("linkGroup.editSuccess"));
      try {
        await onRenameLinkGroup(linkGroupId, name);
      } catch (error) {
        console.error("重命名文件夹失败:", error);
        await refreshCategoriesData();
      }
    },
    [
      onRenameLinkGroup,
      optimisticRenameLinkGroup,
      refreshCategoriesData,
      t,
    ]
  );

  // 删除分类确认弹窗状态
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  // 待删除的分类
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  // 处理删除分类点击 - 打开确认弹窗
  const onDeleteCategoryClick = useCallback((categoryId: string) => {
    // 待删除的分类
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setCategoryToDelete({ id: categoryId, name: category.name });
      setIsDeleteCategoryDialogOpen(true);
    }
  }, [categories]);

  // 确认删除分类（先检查最少保留一个，再乐观删除）
  const confirmDeleteCategory = useCallback(async () => {
    const target = categoryToDelete;
    setIsDeleteCategoryDialogOpen(false);
    setCategoryToDelete(null);
    if (!target) {
      return;
    }
    if (categories.length <= 1) {
      toast.warning(t("category.keepOne"));
      return;
    }
    optimisticDeleteCategory(target.id);
    toast.success(t("category.deleteSuccess"));
    try {
      await onDeleteCategory(target.id);
    } catch (error) {
      console.error("删除分类失败:", error);
      await refreshCategoriesData();
    }
  }, [
    categories.length,
    categoryToDelete,
    onDeleteCategory,
    optimisticDeleteCategory,
    refreshCategoriesData,
    t,
  ]);

  /** 还原拖拽预览后按对象类型打开对应删除确认弹窗。 */
  const onDropToTrash = useCallback(
    async (item: PageDragItem) => {
      await refreshCategoriesData();
      // 不同拖拽对象对应的删除确认策略
      const deleteRequestStrategies: Record<
        PageDragItem["type"],
        () => void
      > = {
        [DRAG_ITEM_TYPE.CATEGORY]: () =>
          onDeleteCategoryClick((item as CategoryDragItem).id),
        [DRAG_ITEM_TYPE.LINK]: () =>
          onDeleteLinkClick((item as LinkDragItem).link.id),
        [DRAG_ITEM_TYPE.LINK_GROUP]: () =>
          onDeleteLinkGroupClick((item as LinkGroupDragItem).linkGroup),
      };
      deleteRequestStrategies[item.type]();
    },
    [
      onDeleteCategoryClick,
      onDeleteLinkClick,
      onDeleteLinkGroupClick,
      refreshCategoriesData,
    ]
  );

  /** 直接将网格拖放过来的网址固定到 Dock。 */
  const pinLinkFromGrid = useCallback(
    async (item: LinkDragItem) => {
      await pinDockLink(item.link.id);
    },
    [pinDockLink]
  );

  // 设置弹窗开关与当前分栏
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] =
    useState<SettingSection>("wallpaper");

  /** 从空分类引导打开设置面板的数据管理页。 */
  const openBookmarkImportInSettings = useCallback(() => {
    setSettingsSection("data");
    setIsSettingsOpen(true);
  }, []);

  /** 从 Dock 为当前分类打开网址添加表单。 */
  const openAddLinkFromDock = useCallback(() => {
    onOpenAddLink(currentCategoryId);
  }, [currentCategoryId, onOpenAddLink]);

  /** 从 Dock 为当前分类打开文件夹创建表单。 */
  const openCreateFolderFromDock = useCallback(() => {
    onOpenCreateLinkGroup(currentCategoryId);
  }, [currentCategoryId, onOpenCreateLinkGroup]);

  useEffect(() => {
    document.title = t("meta.newTabTitle");
  }, [t]);

  useEffect(() => {
    return () => {
      if (programmaticScrollTargetRef.current) {
        window.clearTimeout(programmaticScrollTargetRef.current.timer);
      }
    };
  }, []);

  return (
    <PageDndProvider>
      <CardContextMenuProvider
        categories={categories}
        dockLinks={dockLinks}
        onOpenLink={handleSkipClick}
        onEditLink={onOpenEditLink}
        onPinDockLink={pinDockLink}
        onUnpinDockLink={unpinDockLink}
        onMoveLink={moveLink}
        onMoveCategoryItem={moveCategoryItem}
        onDeleteLink={onDeleteLinkClick}
        onOpenAddLink={onOpenAddLink}
        onDeleteFolder={onDeleteLinkGroupClick}
      >
        <div
          data-category-page-scroll=""
          className="relative h-screen min-h-screen w-screen snap-y snap-mandatory overflow-x-hidden overflow-y-scroll bg-[var(--surface-canvas)] text-[var(--surface-text)]"
          style={{ ...backgroundStyle, scrollbarWidth: "none" }}
        >
          <div
            className="atmosphere-backdrop pointer-events-none fixed inset-0 z-0"
            aria-hidden="true"
          />

          <section className="fixed left-3 right-3 top-3 z-30 h-14 md:inset-y-5 md:left-5 md:right-auto md:h-auto md:w-48">
            <NavigationBar
              activeCategoryId={currentCategoryId}
              categories={categories}
              changeCurrentCategory={navigateToCategory}
              addCategory={onOpenAdd}
              handleEditClick={onOpenEdit}
              onMoveCategory={updateCategoryOrder}
              onMoveLink={moveLink}
              onMoveCategoryItem={moveCategoryItem}
              isSettingsOpen={isSettingsOpen}
              settingsSection={settingsSection}
              onSettingsOpenChange={setIsSettingsOpen}
              onSettingsSectionChange={setSettingsSection}
              onDataChanged={refreshCategoriesData}
            />
          </section>

          <div className="pointer-events-none fixed left-4 right-4 top-[76px] z-40 flex justify-center md:left-[232px] md:right-8 md:top-0 md:h-32 md:w-auto md:items-center xl:left-1/2 xl:right-auto xl:w-full xl:max-w-[840px] xl:-translate-x-1/2 xl:px-8">
            <SearchInput
              className="pointer-events-auto"
              categories={categories}
              onOpenLink={handleSkipClick}
            />
          </div>

          {categories.map((category) => (
            <CategoryPage
              key={category.id}
              categoryInfo={category}
              isActive={currentCategoryId === category.id}
              scrollTriggerToken={scrollTriggerToken}
              shouldIgnoreIntersection={shouldIgnoreIntersection}
              onProgrammaticScrollSettled={handleProgrammaticScrollSettled}
              onOpenEditLink={onOpenEditLink}
              moveLink={moveLink}
              mergeLinks={mergeLinks}
              moveCategoryItem={moveCategoryItem}
              onCancelLinkDrag={refreshCategoriesData}
              onOpenAddLink={onOpenAddLink}
              onOpenBookmarkImport={openBookmarkImportInSettings}
              onRenameLinkGroup={handleRenameLinkGroup}
              onDeleteLinkGroup={onDeleteLinkGroupClick}
              handleCategoryChange={changeCurrentCategory}
            />
          ))}

          <Dock
            dockLinks={dockLinks}
            onAddLink={openAddLinkFromDock}
            onCreateFolder={openCreateFolderFromDock}
            onPinLink={pinLinkFromGrid}
            onMoveDockLink={moveDockLink}
            onUnpinDockLink={unpinDockLink}
            onDropToTrash={onDropToTrash}
          />
          {/* 添加分类 */}
          <AddCategory
            open={isOpen}
            mode={mode}
            initialData={initialData}
            handleClose={onClose}
            canDelete={categories.length > 1}
            onDelete={() => {
              if (!editingCategoryId) {
                return;
              }
              onClose();
              onDeleteCategoryClick(editingCategoryId);
            }}
            handleSubmit={async (data) => {
              await onSubmit(data);
              //刷新分类列表
              await refreshCategoriesData();
              toast.success(t("messages.operationSuccess"));
            }}
          />
          {/* 添加链接 */}
          <AddEditLink
            open={isOpenLink}
            mode={modeLink}
            initialData={initialDataLink}
            categories={categories}
            defaultParentId={defaultParentId ?? currentCategoryId}
            handleClose={onCloseLink}
            onDelete={() => {
              if (!editingLinkId) {
                return;
              }
              onCloseLink();
              onDeleteLinkClick(editingLinkId);
            }}
            handleSubmit={async (data) => {
              await onSubmitLink(data);
              //刷新当前分类的链接列表
              await refreshCategoriesData();
              toast.success(t("messages.operationSuccess"));
            }}
          />
          {/* 新建网址分组 */}
          {isCreateLinkGroupOpen ? (
            <EditLinkGroup
              open
              onClose={onCloseCreateLinkGroup}
              onSubmit={async (name) => {
                await onCreateLinkGroup(name);
                await refreshCategoriesData();
                toast.success(t("linkGroup.createSuccess"));
              }}
            />
          ) : null}
          {/* 删除链接确认弹窗 */}
          <DeleteConfirmDialog
            isOpen={isDeleteLinkDialogOpen}
            onOpenChange={setIsDeleteLinkDialogOpen}
            title={t("link.confirmDelete")}
            itemName={linkToDelete?.title || ""}
            onConfirm={confirmDeleteLink}
          />
          {/* 删除网址分组确认弹窗 */}
          <DeleteConfirmDialog
            isOpen={isDeleteLinkGroupDialogOpen}
            onOpenChange={setIsDeleteLinkGroupDialogOpen}
            title={t("linkGroup.confirmDelete")}
            itemName={linkGroupToDelete?.name ?? ""}
            onConfirm={confirmDeleteLinkGroup}
          />
          {/* 删除分类确认弹窗 */}
          <DeleteConfirmDialog
            isOpen={isDeleteCategoryDialogOpen}
            onOpenChange={setIsDeleteCategoryDialogOpen}
            title={t("category.confirmDelete")}
            itemName={categoryToDelete?.name || ""}
            description={t("category.deleteDescription", {
              itemName: categoryToDelete?.name || "",
            })}
            onConfirm={confirmDeleteCategory}
          />
          <Toaster position="top-right" />
        </div>
      </CardContextMenuProvider>
    </PageDndProvider>
  );
};

export default NewTabApp;
