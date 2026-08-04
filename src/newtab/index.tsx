import React, { useState, useCallback, useEffect } from "react";
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
import DeleteConfirmDialog from "@/newtab/components/DeleteConfirmDialog";
import EditLinkGroup from "@/newtab/components/EditLinkGroup";
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
  } = useData();
  // Dock 固定网址及其持久化操作
  const {
    dockLinks,
    pinDockLink,
    moveDockLink,
    unpinDockLink,
  } = useDockLinks(categories);
  // 分类编辑操作
  const {
    isOpen,
    mode,
    initialData,
    onOpenAdd,
    onOpenEdit,
    onDeleteCategory,
    onClose,
    onSubmit,
  } = useCategoryAction();

  // 网址编辑操作
  const {
    isOpen: isOpenLink,
    mode: modeLink,
    initialData: initialDataLink,
    defaultParentId,
    onOpenAdd: onOpenAddLink,
    onOpenEdit: onOpenEditLink,
    onDeleteLink,
    onClose: onCloseLink,
    onSubmit: onSubmitLink,
  } = useLinkAction();

  // 网址分组编辑和删除操作
  const {
    isOpen: isEditLinkGroupOpen,
    mode: linkGroupMode,
    editingLinkGroup,
    onOpenCreate: onOpenCreateLinkGroup,
    onOpenEdit: onOpenEditLinkGroup,
    onClose: onCloseEditLinkGroup,
    onSubmit: onSubmitLinkGroup,
    onDelete: onDeleteLinkGroup,
  } = useLinkGroupAction();

  /* 跳转链接 */
  const handleSkipClick = (url: string) => {
    window.open(url, "_blank");
  };

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

  // 确认删除链接
  const confirmDeleteLink = useCallback(async () => {
    if (linkToDelete) {
      await onDeleteLink(linkToDelete.id);
      await refreshCategoriesData();
      toast.success(t("link.deleteSuccess"));
    }
    setIsDeleteLinkDialogOpen(false);
    setLinkToDelete(null);
  }, [linkToDelete, onDeleteLink, refreshCategoriesData, t]);

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

  /** 删除网址分组并刷新分类数据。 */
  const confirmDeleteLinkGroup = useCallback(async () => {
    if (linkGroupToDelete) {
      await onDeleteLinkGroup(linkGroupToDelete.id);
      await refreshCategoriesData();
      toast.success(t("linkGroup.deleteSuccess"));
    }
    setIsDeleteLinkGroupDialogOpen(false);
    setLinkGroupToDelete(null);
  }, [linkGroupToDelete, onDeleteLinkGroup, refreshCategoriesData, t]);

  // 删除分类确认弹窗状态
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  // 待删除的分类
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  // 处理删除分类点击 - 打开确认弹窗
  const onDeleteCategoryClick = useCallback((categoryId: string) => {
    // 待删除的分类
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setCategoryToDelete({ id: categoryId, name: category.name });
      setIsDeleteCategoryDialogOpen(true);
    }
  }, [categories]);

  // 确认删除分类
  const confirmDeleteCategory = useCallback(async () => {
    if (categoryToDelete) {
      await onDeleteCategory(categoryToDelete.id);
      await refreshCategoriesData();
      toast.success(t("category.deleteSuccess"));
    }
    setIsDeleteCategoryDialogOpen(false);
    setCategoryToDelete(null);
  }, [categoryToDelete, onDeleteCategory, refreshCategoriesData, t]);

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

  /** 还原网址网格预览后将网址固定到 Dock。 */
  async function pinLinkFromGrid(item: LinkDragItem) {
    await refreshCategoriesData();
    await pinDockLink(item.link.id);
  }

  /** 从 Dock 为当前分类打开网址添加表单。 */
  function openAddLinkFromDock() {
    onOpenAddLink(currentCategoryId);
  }

  /** 从 Dock 为当前分类打开文件夹创建表单。 */
  function openCreateFolderFromDock() {
    onOpenCreateLinkGroup(currentCategoryId);
  }

  useEffect(() => {
    document.title = t("meta.newTabTitle");
  }, [t]);

  return (
    <PageDndProvider>
      <div
        data-category-page-scroll=""
        className="relative h-screen min-h-screen w-screen snap-y snap-mandatory overflow-x-hidden overflow-y-scroll bg-[#090c10] text-white"
        style={{ ...backgroundStyle, scrollbarWidth: "none" }}
      >
        <div
          className="atmosphere-backdrop pointer-events-none fixed inset-0 z-0 backdrop-saturate-[0.82]"
          aria-hidden="true"
        />

        <section className="fixed left-3 right-3 top-3 z-30 h-14 md:left-0 md:right-auto md:top-1/2 md:h-auto md:w-44 md:-translate-y-1/2">
          <NavigationBar
            activeCategoryId={currentCategoryId}
            categories={categories}
            changeCurrentCategory={changeCurrentCategory}
            addCategory={() => onOpenAdd()}
            handleEditClick={(categoryId) => onOpenEdit(categoryId)}
            onMoveCategory={updateCategoryOrder}
            onMoveLink={moveLink}
            onMoveCategoryItem={moveCategoryItem}
          />
        </section>

        <div className="pointer-events-none fixed left-4 right-4 top-[76px] z-40 flex justify-center md:left-1/2 md:right-auto md:top-0 md:h-36 md:w-full md:max-w-[840px] md:-translate-x-1/2 md:items-center md:px-8">
          <SearchInput
            className="pointer-events-auto"
            categories={categories}
            onOpenLink={handleSkipClick}
          />
        </div>

        {categories.map((category) => {
          return (
            <CategoryPage
              key={category.id}
              categoryInfo={category}
              currentCategoryId={currentCategoryId}
              onOpenEditLink={onOpenEditLink}
              handleSkipClick={handleSkipClick}
              moveLink={moveLink}
              mergeLinks={mergeLinks}
              moveCategoryItem={moveCategoryItem}
              onCancelLinkDrag={refreshCategoriesData}
              onOpenAddLink={onOpenAddLink}
              onEditLinkGroup={onOpenEditLinkGroup}
              handleCategoryChange={changeCurrentCategory}
            />
          );
        })}

        <Dock
          dockLinks={dockLinks}
          onAddLink={openAddLinkFromDock}
          onCreateFolder={openCreateFolderFromDock}
          onOpenLink={handleSkipClick}
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
          handleSubmit={async (data) => {
            await onSubmitLink(data);
            //刷新当前分类的链接列表
            await refreshCategoriesData();
            toast.success(t("messages.operationSuccess"));
          }}
        />
        {/* 编辑网址分组 */}
        {isEditLinkGroupOpen ? (
          <EditLinkGroup
            open
            mode={linkGroupMode}
            initialName={editingLinkGroup?.name ?? ""}
            onClose={onCloseEditLinkGroup}
            onSubmit={async (name) => {
              await onSubmitLinkGroup(name);
              await refreshCategoriesData();
              toast.success(
                t(
                  linkGroupMode === "create"
                    ? "linkGroup.createSuccess"
                    : "linkGroup.editSuccess"
                )
              );
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
    </PageDndProvider>
  );
};

export default NewTabApp;
