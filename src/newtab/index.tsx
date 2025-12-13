import React, { useState, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import LinkItem from "./components/LinkItem";
import NavigationBar from "./components/NavigationBar";
import { useData } from "./useData";
import { useCategoryAction } from "../hooks/useCategoryAction";
import AddCategory from "./components/AddEditCategory";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import { useBackgroundImg } from "../hooks/useBackgroundImg";
import useSystemStore from "../store/systemStore";
import AddEditLink from "./components/AddEditLink";
import { useLinkAction } from "../hooks/useLinkAction";
import { Plus } from "lucide-react";
import Setting from "./components/Setting";

const NewTabApp: React.FC = () => {
  const isInitializedBackgroundImage = useSystemStore(
    (state) => state.isInitializedBackgroundImage
  );
  const {
    currentCategoryId,
    categories,
    categoryLinks,
    changeCurrentCategory,
    refreshCategories,
    refreshCategoryLinks,
    updateCategoryOrder,
  } = useData();
  const { backgroundImage } = useBackgroundImg();
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
  const [searchQuery, setSearchQuery] = useState("");

  /* 背景样式 */
  const backgroundStyle = useMemo(() => {
    return {
      background: isInitializedBackgroundImage
        ? backgroundImage
          ? `url(${backgroundImage}) center/cover no-repeat`
          : "linear-gradient(to bottom right, rgb(99, 102, 241), rgb(168, 85, 247))"
        : "rgb(0, 0, 0,0.8)",
    };
  }, [isInitializedBackgroundImage, backgroundImage]);

  const handleSearch = (query: string) => {
    if (query.trim() === "") return;

    const urlPattern = /^(https?:\/\/|www\.)/i;
    const domainPattern =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;

    if (urlPattern.test(query)) {
      window.location.href = query.startsWith("http")
        ? query
        : "https://" + query;
    } else if (domainPattern.test(query)) {
      window.location.href = "https://" + query;
    } else {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(
        query
      )}`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  /* 跳转链接 */
  const handleSkipClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div
      className="min-h-screen w-screen flex flex-row items-center justify-center text-white relative overflow-hidden"
      style={{ ...backgroundStyle }}
    >
      {/* 设置组件 */}
      <Setting />

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

      <section className="flex-1 p-8">
        <input
          type="text"
          className="w-full max-w-2xl px-8 py-4 text-lg border-none rounded-full bg-white/15 backdrop-blur-md text-white placeholder-white/70 outline-none transition-all duration-300 focus:bg-white/25 focus:-translate-y-0.5 focus:shadow-xl focus:shadow-black/20"
          placeholder="搜索或输入网址..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          autoFocus
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6 mb-8 mt-8">
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
            className="glass-style-border flex items-center justify-center rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl  hover:-translate-y-2 cursor-pointer"
            onClick={onOpenAddLink}
          >
            <Plus size={32} />
          </div>
        </div>
      </section>
      {/* <Setting /> */}
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
