import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import NavigationBar from "@/newtab/components/NavigationBar";
import { useData } from "@/newtab/useData";
import { useCategoryAction } from "@/hooks/useCategoryAction";
import AddCategory from "@/newtab/components/AddEditCategory";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import AddEditLink from "@/newtab/components/AddEditLink";
import { useLinkAction } from "@/hooks/useLinkAction";
import Setting from "@/newtab/components/Setting";
import SearchInput from "@/newtab/components/SearchInput";
import CategoryPage from "@/newtab/components/CategoryPage";
import LinkDragPreview from "@/newtab/components/LinkList/LinkDragPreview";
import DeleteConfirmDialog from "@/newtab/components/DeleteConfirmDialog";
import EditLinkGroup from "@/newtab/components/EditLinkGroup";
import { useLinkGroupAction } from "@/hooks/useLinkGroupAction";
import type { LinkGroupInfo } from "@/type/db";

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
    editingLinkGroup,
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

  useEffect(() => {
    document.title = t("meta.newTabTitle");
  }, [t]);

  return (
    <DndProvider backend={HTML5Backend}>
      <LinkDragPreview />

      <div
        className="min-h-screen w-screen text-white relative h-screen overflow-y-scroll snap-y snap-mandatory"
        style={{ ...backgroundStyle, scrollbarWidth: "none" }}
      >
        <section className="fixed left-0 top-[50%] translate-y-[-50%] w-[220px]">
          <NavigationBar
            activeCategoryId={currentCategoryId}
            categories={categories}
            changeCurrentCategory={changeCurrentCategory}
            addCategory={() => onOpenAdd()}
            handleEditClick={(categoryId) => onOpenEdit(categoryId)}
            handleDeleteClick={onDeleteCategoryClick}
            onMoveCategory={updateCategoryOrder}
            onMoveLink={moveLink}
            onMoveCategoryItem={moveCategoryItem}
          />
        </section>

        <div className="pointer-events-none fixed left-[50%] top-0 translate-x-[-50%] w-full h-[160px] flex items-center justify-center">
          <SearchInput className="pointer-events-auto" />
        </div>

        {categories.map((category) => {
          return (
            <CategoryPage
              key={category.id}
              categoryInfo={category}
              currentCategoryId={currentCategoryId}
              onOpenEditLink={onOpenEditLink}
              onDeleteLinkClick={onDeleteLinkClick}
              handleSkipClick={handleSkipClick}
              moveLink={moveLink}
              mergeLinks={mergeLinks}
              moveCategoryItem={moveCategoryItem}
              onCancelLinkDrag={refreshCategoriesData}
              onOpenAddLink={onOpenAddLink}
              onEditLinkGroup={onOpenEditLinkGroup}
              onDeleteLinkGroup={onDeleteLinkGroupClick}
              handleCategoryChange={changeCurrentCategory}
            />
          );
        })}

        {/* 设置组件 */}
        <Setting />
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
        <EditLinkGroup
          open={isEditLinkGroupOpen}
          initialName={editingLinkGroup?.name ?? ""}
          onClose={onCloseEditLinkGroup}
          onSubmit={async (name) => {
            await onSubmitLinkGroup(name);
            await refreshCategoriesData();
            toast.success(t("linkGroup.editSuccess"));
          }}
        />
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
          onConfirm={confirmDeleteCategory}
        />
        <Toaster position="top-right" />
      </div>
    </DndProvider>
  );
};

export default NewTabApp;
