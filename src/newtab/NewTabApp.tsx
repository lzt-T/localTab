import React, { useState, useRef, useMemo } from "react";
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
  } = useData();
  const { backgroundImage, onUploadBackground, onDeleteBackground } =
    useBackgroundImg();
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

  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 处理背景图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUploadBackground(file);
  };

  // 删除背景图片
  const handleRemoveBackground = async () => {
    try {
      await onDeleteBackground();
      setShowSettings(false);
    } catch (error) {
      console.error("删除背景图片失败:", error);
      alert("删除背景图片失败");
    }
  };

  // 触发文件选择
  const onTriggerFileSelect = () => {
    fileInputRef.current?.click();
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
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* 设置按钮 */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-8 left-8 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300"
        title="设置"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* 设置面板 */}
      {showSettings && (
        <div className="fixed top-24 left-8 z-50 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 w-80">
          <h3 className="text-xl font-semibold mb-4">背景设置</h3>
          <div className="space-y-3">
            <button
              onClick={onTriggerFileSelect}
              className="w-full px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              上传背景图片
            </button>
            {backgroundImage && (
              <button
                onClick={handleRemoveBackground}
                className="w-full px-4 py-3 bg-red-500/30 hover:bg-red-500/40 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                删除背景图片
              </button>
            )}
          </div>
        </div>
      )}

      <section className="w-[220px]">
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
        />
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
                await onDeleteLink(linkId);
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
