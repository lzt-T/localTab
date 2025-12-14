import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import LinkItem from "./components/LinkItem";
import NavigationBar from "./components/NavigationBar";
import { useData } from "./useData";
import { useCategoryAction } from "../hooks/useCategoryAction";
import AddCategory from "./components/AddEditCategory";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import AddEditLink from "./components/AddEditLink";
import { useLinkAction } from "../hooks/useLinkAction";
import { Plus } from "lucide-react";
import Setting from "./components/Setting";
import SearchInput from "./components/SearchInput";
import { cn } from "@/lib/utils";

const NewTabApp: React.FC = () => {
  const {
    currentCategoryId,
    categories,
    categoryLinks,
    linkListRef,
    backgroundStyle,
    changeCurrentCategory,
    refreshCategories,
    refreshCategoryLinks,
    updateCategoryOrder,
  } = useData();
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
  const {
    isOpen: isOpenLink,
    mode: modeLink,
    initialData: initialDataLink,
    onOpenAdd: onOpenAddLink,
    onOpenEdit: onOpenEditLink,
    onDeleteLink,
    onClose: onCloseLink,
    onSubmit: onSubmitLink,
  } = useLinkAction();

  /* 跳转链接 */
  const handleSkipClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div
      className="min-h-screen w-screen flex flex-row items-center justify-center text-white relative overflow-hidden"
      style={{ ...backgroundStyle }}
    >
      <section className="w-[220px]">
        <DndProvider backend={HTML5Backend}>
          <NavigationBar
            activeCategoryId={currentCategoryId}
            categories={categories}
            changeCurrentCategory={changeCurrentCategory}
            addCategory={() => onOpenAdd()}
            handleEditClick={(categoryId) => onOpenEdit(categoryId)}
            handleDeleteClick={async (categoryId) => {
              await onDeleteCategory(categoryId);
              await refreshCategories();
              toast.success("删除分类成功");
            }}
            onMoveCategory={updateCategoryOrder}
          />
        </DndProvider>
      </section>

      <section className="flex-1 p-8  h-screen flex flex-col">
        <div className="h-[160px] flex items-center justify-center">
          <SearchInput />
        </div>

        <div
          ref={linkListRef}
          className={cn(
            "flex-1 overflow-y-auto pt-2 px-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6"
          )}
        >
          {categoryLinks.map((link) => (
            <LinkItem
              key={link.id}
              link={link}
              handleEditClick={onOpenEditLink}
              handleDeleteClick={async (linkId) => {
                await onDeleteLink(currentCategoryId, linkId);
                await refreshCategoryLinks(currentCategoryId);
                toast.success("删除链接成功");
              }}
              handleSkipClick={handleSkipClick}
            />
          ))}

          {/* 添加按钮 */}
          <div
            className="glass-style-border flex items-center justify-center rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl  hover:-translate-y-2 cursor-pointer h-32"
            onClick={onOpenAddLink}
          >
            <Plus size={32} />
          </div>

          {Array.from({ length: 100 }).map((_, index) => (
            <div
              key={index}
              className="glass-style-border flex items-center justify-center rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl  hover:-translate-y-2 cursor-pointer h-32"
            >
              <Plus size={32} />
            </div>
          ))}
        </div>
      </section>
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
          await refreshCategories();
          toast.success("操作成功");
        }}
      />
      {/* 添加链接 */}
      <AddEditLink
        open={isOpenLink}
        mode={modeLink}
        initialData={initialDataLink}
        handleClose={onCloseLink}
        handleSubmit={async (data) => {
          await onSubmitLink({
            parentId: currentCategoryId,
            ...data,
          });
          //刷新当前分类的链接列表
          await refreshCategoryLinks(currentCategoryId);
          toast.success("操作成功");
        }}
      />
      <Toaster position="top-right" />
    </div>
  );
};

export default NewTabApp;
