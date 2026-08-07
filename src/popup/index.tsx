import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BookmarkPlus,
  FolderPlus,
  Github,
  Globe2,
  Home,
  LoaderCircle,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import {
  useQuickBookmark,
  type QuickBookmarkStatus,
} from "@/popup/useQuickBookmark";

// Chromium 扩展 API 最小类型声明
declare const chrome: {
  tabs: {
    create: (options?: { url?: string }) => void;
  };
};

// GitHub 仓库地址
const GITHUB_REPOSITORY_URL = "https://github.com/lzt-T/localTab";

/** 扩展弹窗入口。 */
const PopupApp: React.FC = () => {
  // 国际化工具
  const { t } = useTranslation();
  // 当前页面快速收藏状态和操作
  const {
    status,
    page,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    isCategoryFormOpen,
    newCategoryName,
    categoryNameError,
    isCreatingCategory,
    isSubmitting,
    canBookmark,
    openCategoryForm,
    closeCategoryForm,
    changeNewCategoryName,
    createCategory,
    bookmarkCurrentPage,
  } = useQuickBookmark();

  /** 打开当前浏览器的新标签页。 */
  function handleOpenNewTab() {
    chrome.tabs.create({});
    window.close();
  }

  /** 打开项目仓库。 */
  function handleOpenGitHub() {
    chrome.tabs.create({ url: GITHUB_REPOSITORY_URL });
    window.close();
  }

  /** 重新加载弹窗数据。 */
  function reloadPopup() {
    window.location.reload();
  }

  /** 响应快速分类名称输入的确认和取消键。 */
  function handleCategoryNameKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter" && !isCreatingCategory) {
      createCategory();
    }
    if (event.key === "Escape") {
      closeCategoryForm();
    }
  }

  // 活动页面不同加载状态对应的展示内容
  const pageStatusContent: Record<QuickBookmarkStatus, React.ReactNode> = {
    loading: (
      <div className="flex min-h-20 items-center justify-center gap-2 text-sm text-white/65">
        <LoaderCircle className="size-4 animate-spin text-blue-200 motion-reduce:animate-none" />
        <span>{t("popup.loadingPage")}</span>
      </div>
    ),
    ready: page ? (
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.07] text-white/55">
          <Globe2 className="size-5" aria-hidden="true" />
          {page.icon ? (
            <img
              src={page.icon}
              alt=""
              className="absolute inset-0 size-full object-contain p-1.5"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white/90" title={page.title}>
            {page.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/55" title={page.url}>
            {page.url}
          </p>
        </div>
      </div>
    ) : null,
    unsupported: (
      <div className="flex min-h-20 items-center gap-3 text-sm text-white/65">
        <Globe2 className="size-5 shrink-0 text-white/45" aria-hidden="true" />
        <p className="leading-5">{t("popup.unsupportedPage")}</p>
      </div>
    ),
    error: (
      <div className="flex min-h-20 items-center gap-3">
        <TriangleAlert className="size-5 shrink-0 text-red-300" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5 text-white/70">{t("popup.loadFailed")}</p>
          <Button
            type="button"
            variant="link"
            className="mt-1 h-auto cursor-pointer p-0 text-xs text-blue-200 hover:text-blue-100"
            onClick={reloadPopup}
          >
            {t("popup.retry")}
          </Button>
        </div>
      </div>
    ),
  };

  useEffect(() => {
    document.title = t("meta.popupTitle");
  }, [t]);

  return (
    <div className="relative w-[360px] overflow-hidden bg-[#202226] text-white shadow-2xl ring-1 ring-inset ring-white/10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.16),transparent_44%)]"
      />

      <div className="relative flex flex-col p-5 backdrop-blur-xl">
        <header className="mb-4 flex items-center justify-between text-left">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-white">LocalTab</h1>
            <p className="mt-0.5 text-xs text-white/65">{t("popup.subtitle")}</p>
          </div>
          <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-2.5 py-1 text-xs font-medium text-blue-100/85">
            v1.0.8
          </span>
        </header>

        <main>
          <section aria-labelledby="quick-bookmark-title">
            <h2
              id="quick-bookmark-title"
              className="text-sm font-semibold text-white/90"
            >
              {t("popup.quickBookmarkTitle")}
            </h2>
            <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              {pageStatusContent[status]}
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-white/65">
                {t("popup.categoryLabel")}
              </label>
              {categories.length > 0 ? (
                <Select
                  value={selectedCategoryId || undefined}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger
                    aria-label={t("popup.categoryLabel")}
                    className="mt-1.5 h-10 w-full cursor-pointer rounded-[10px] border-white/10 bg-white/[0.06] text-white focus-visible:border-blue-300/60 focus-visible:ring-blue-300/20"
                  >
                    <SelectValue placeholder={t("popup.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#282a2f] text-white">
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="cursor-pointer focus:bg-white/10 focus:text-white"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1.5 text-xs leading-5 text-white/55">
                  {t("popup.noCategories")}
                </p>
              )}

              {isCategoryFormOpen ? (
                <div className="mt-2.5 rounded-xl bg-white/[0.035] p-2.5">
                  <label htmlFor="quick-category-name" className="sr-only">
                    {t("category.name")}
                  </label>
                  <Input
                    id="quick-category-name"
                    autoFocus
                    value={newCategoryName}
                    aria-invalid={Boolean(categoryNameError)}
                    aria-describedby={categoryNameError ? "quick-category-error" : undefined}
                    placeholder={t("popup.newCategoryPlaceholder")}
                    className="h-10 rounded-[10px] border-white/10 bg-white/[0.06] text-base text-white placeholder:text-white/40 focus-visible:border-blue-300/60 focus-visible:ring-blue-300/20"
                    onChange={(event) => changeNewCategoryName(event.target.value)}
                    onKeyDown={handleCategoryNameKeyDown}
                  />
                  {categoryNameError ? (
                    <p
                      id="quick-category-error"
                      role="alert"
                      className="mt-1.5 text-xs text-red-300"
                    >
                      {categoryNameError}
                    </p>
                  ) : null}
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 cursor-pointer bg-blue-500/85 text-white hover:bg-blue-400"
                      disabled={isCreatingCategory}
                      onClick={createCategory}
                    >
                      {isCreatingCategory ? (
                        <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                      ) : null}
                      {isCreatingCategory
                        ? t("popup.creatingCategory")
                        : t("popup.confirmCreate")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="flex-1 cursor-pointer bg-white/[0.04] text-white/70 hover:bg-white/[0.09] hover:text-white"
                      disabled={isCreatingCategory}
                      onClick={closeCategoryForm}
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-1.5 h-9 w-full cursor-pointer justify-start rounded-[10px] px-2.5 text-xs text-blue-100/80 hover:bg-white/[0.06] hover:text-blue-100"
                  onClick={openCategoryForm}
                >
                  {categories.length > 0 ? <Plus /> : <FolderPlus />}
                  {categories.length > 0
                    ? t("popup.createCategory")
                    : t("popup.createFirstCategory")}
                </Button>
              )}
            </div>

            <Button
              type="button"
              className="mt-3 h-11 w-full cursor-pointer rounded-xl border border-blue-300/20 bg-blue-500/85 px-4 text-sm text-white shadow-[0_8px_24px_rgba(59,130,246,0.2)] hover:bg-blue-400 focus-visible:border-blue-200/50 focus-visible:ring-blue-300/40"
              disabled={!canBookmark}
              onClick={bookmarkCurrentPage}
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin motion-reduce:animate-none" />
              ) : (
                <BookmarkPlus />
              )}
              {isSubmitting ? t("popup.bookmarking") : t("popup.bookmark")}
            </Button>
          </section>

          <div className="my-4 h-px bg-white/10" aria-hidden="true" />

          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              className="group h-10 w-full cursor-pointer justify-start rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white/80 hover:bg-white/[0.09] hover:text-white focus-visible:border-white/20 focus-visible:ring-white/20"
              onClick={handleOpenNewTab}
            >
              <Home className="text-blue-200/75 transition-colors group-hover:text-blue-100" />
              <span className="font-medium">{t("popup.openNewTab")}</span>
            </Button>
            <Button
              variant="ghost"
              className="group h-10 w-full cursor-pointer justify-start rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white/80 hover:bg-white/[0.09] hover:text-white focus-visible:border-white/20 focus-visible:ring-white/20"
              onClick={handleOpenGitHub}
            >
              <Github className="text-blue-200/75 transition-colors group-hover:text-blue-100" />
              <span className="truncate font-medium">lzt-T/localTab</span>
            </Button>
          </div>
        </main>

        <footer className="mt-4 border-t border-white/10 pt-3 text-center">
          <p className="text-xs font-medium text-white/65">{t("popup.tagline")}</p>
        </footer>
      </div>
      <Toaster position="top-center" />
    </div>
  );
};

export default PopupApp;
