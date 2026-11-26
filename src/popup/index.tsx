import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BookmarkPlus,
  Check,
  ChevronDown,
  FolderPlus,
  Github,
  Globe2,
  Home,
  LoaderCircle,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  useQuickBookmark,
  type QuickBookmarkStatus,
} from "@/popup/useQuickBookmark";
import { isBrowserDefaultFaviconImage } from "@/utils/webIcon";

// Chromium 扩展 API 最小类型声明
declare const chrome: {
  tabs: {
    create: (options?: { url?: string }) => void;
  };
  runtime?: {
    getManifest?: () => { version?: string };
  };
};

// 构建期由 Vite 注入的应用版本号
declare const __APP_VERSION__: string;

// GitHub 仓库地址
const GITHUB_REPOSITORY_URL = "https://github.com/lzt-T/localTab";

// 收藏名称错误提示标识
const BOOKMARK_TITLE_ERROR_ID = "quick-bookmark-title-error";

/** 扩展弹窗入口。 */
const PopupApp: React.FC = () => {
  // 国际化工具
  const { t } = useTranslation();
  // 收藏名称错误提示标识
  const {
    status,
    page,
    bookmarkTitle,
    bookmarkTitleError,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    linkGroups,
    selectedLinkGroupId,
    setSelectedLinkGroupId,
    isCategoryFormOpen,
    newCategoryName,
    categoryNameError,
    isCreatingCategory,
    isSubmitting,
    canBookmark,
    changeBookmarkTitle,
    openCategoryForm,
    closeCategoryForm,
    changeNewCategoryName,
    createCategory,
    bookmarkCurrentPage,
  } = useQuickBookmark();
  // 当前所选分类的展示名称
  const selectedCategoryName =
    categories.find((category) => category.id === selectedCategoryId)?.name ??
    t("popup.selectCategory");
  // 当前所选文件夹的展示名称
  const selectedLinkGroupName =
    linkGroups.find((group) => group.id === selectedLinkGroupId)?.name ??
    t("linkGroup.ungrouped");
  // 当前展示的应用版本号（优先读取扩展 manifest，回退为构建期注入版本）
  const appVersion =
    (typeof chrome !== "undefined"
      ? chrome.runtime?.getManifest?.()?.version
      : undefined) ?? __APP_VERSION__;

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

  /** 响应收藏名称输入框回车直接提交收藏。 */
  function handleBookmarkTitleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === "Enter" && canBookmark) {
      event.preventDefault();
      void bookmarkCurrentPage();
    }
  }

  /** 响应快速分类名称输入的确认和取消键。 */
  function handleCategoryNameKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter" && !isCreatingCategory) {
      void createCategory();
    }
    if (event.key === "Escape") {
      closeCategoryForm();
    }
  }

  // 活动页面不同加载状态对应的展示内容
  const pageStatusContent: Record<QuickBookmarkStatus, React.ReactNode> = {
    loading: (
      <div className="flex min-h-14 items-center justify-center gap-2 text-sm text-white/65">
        <LoaderCircle className="size-4 animate-spin text-blue-200 motion-reduce:animate-none" />
        <span>{t("popup.loadingPage")}</span>
      </div>
    ),
    ready: page ? (
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/[0.07] text-white/55">
          <Globe2 className="size-4" aria-hidden="true" />
          {page.icon ? (
            <img
              src={page.icon}
              alt=""
              className="absolute inset-0 size-full object-contain p-1"
              onLoad={(event) => {
                const imageElement = event.currentTarget;
                const currentIcon = page.icon;
                void isBrowserDefaultFaviconImage(
                  imageElement,
                  currentIcon
                ).then((isDefaultPlaceholder) => {
                  if (isDefaultPlaceholder) {
                    imageElement.hidden = true;
                  }
                });
              }}
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          ) : null}
        </div>
        <p className="min-w-0 flex-1 truncate text-xs text-white/65" title={page.url}>
          {page.url}
        </p>
      </div>
    ) : null,
    unsupported: (
      <div className="flex min-h-14 items-center gap-3 text-sm text-white/65">
        <Globe2 className="size-5 shrink-0 text-white/45" aria-hidden="true" />
        <p className="leading-5">{t("popup.unsupportedPage")}</p>
      </div>
    ),
    error: (
      <div className="flex min-h-14 items-center gap-3">
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
    <div className="relative w-[360px] overflow-hidden bg-[#141416] text-white shadow-2xl ring-1 ring-inset ring-white/10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_44%)]"
      />

      <div className="relative flex flex-col p-4 backdrop-blur-xl">
        <header className="mb-3 flex items-center justify-between text-left">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-white">LocalTab</h1>
            <p className="mt-0.5 text-xs text-white/65">{t("popup.subtitle")}</p>
          </div>
          <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-2.5 py-1 text-xs font-medium text-blue-100/85">
            v{appVersion}
          </span>
        </header>

        <main>
          <section aria-label={t("popup.quickBookmarkTitle")}>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              {pageStatusContent[status]}
            </div>

            {status === "ready" ? (
              <div className="mt-3">
                <label
                  htmlFor="quick-bookmark-title-input"
                  className="block text-xs font-medium text-white/65"
                >
                  {t("popup.titleLabel")}
                </label>
                <Input
                  id="quick-bookmark-title-input"
                  type="text"
                  value={bookmarkTitle}
                  maxLength={50}
                  placeholder={t("popup.titlePlaceholder")}
                  aria-invalid={Boolean(bookmarkTitleError)}
                  aria-describedby={
                    bookmarkTitleError ? BOOKMARK_TITLE_ERROR_ID : undefined
                  }
                  onChange={(event) => changeBookmarkTitle(event.target.value)}
                  onKeyDown={handleBookmarkTitleKeyDown}
                  className={cn(
                    "mt-1.5 h-10 rounded-[10px] border-white/10 bg-white/[0.06] px-3 text-sm text-white placeholder:text-white/40 focus-visible:border-blue-300/60 focus-visible:ring-[3px] focus-visible:ring-blue-300/20",
                    bookmarkTitleError &&
                      "border-red-400/70 focus-visible:border-red-400 focus-visible:ring-red-300/20"
                  )}
                />
                {bookmarkTitleError ? (
                  <p
                    id={BOOKMARK_TITLE_ERROR_ID}
                    role="alert"
                    className="mt-1.5 text-xs text-red-300"
                  >
                    {bookmarkTitleError}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-3.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-white/65">
                  {t("popup.categoryLabel")}
                </label>
                {!isCategoryFormOpen ? (
                  <button
                    type="button"
                    onClick={openCategoryForm}
                    className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-md px-1.5 text-xs font-medium text-blue-200/85 outline-none transition-colors hover:bg-white/[0.06] hover:text-blue-100 focus-visible:ring-2 focus-visible:ring-blue-300/40"
                  >
                    {categories.length > 0 ? (
                      <Plus className="size-3.5" aria-hidden="true" />
                    ) : (
                      <FolderPlus className="size-3.5" aria-hidden="true" />
                    )}
                    <span>
                      {categories.length > 0
                        ? t("popup.createCategory")
                        : t("popup.createFirstCategory")}
                    </span>
                  </button>
                ) : null}
              </div>

              {categories.length > 0 ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("popup.categoryLabel")}
                      className="mt-1.5 flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-white/10 bg-white/[0.06] px-3 text-sm text-white outline-none transition-[color,box-shadow] focus-visible:border-blue-300/60 focus-visible:ring-[3px] focus-visible:ring-blue-300/20 data-[state=open]:border-blue-300/60 data-[state=open]:ring-[3px] data-[state=open]:ring-blue-300/20"
                    >
                      <span className="truncate">{selectedCategoryName}</span>
                      <ChevronDown
                        className="size-4 shrink-0 text-white/50"
                        aria-hidden="true"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={4}
                    className="z-[100] max-h-52 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-[10px] border-white/12 bg-[#1e1e22] p-1 text-white shadow-xl"
                  >
                    <DropdownMenuRadioGroup
                      value={selectedCategoryId}
                      onValueChange={setSelectedCategoryId}
                    >
                      {categories.map((category) => (
                        <DropdownMenuRadioItem
                          key={category.id}
                          value={category.id}
                          className="h-9 cursor-pointer rounded-md px-2 data-[state=checked]:bg-white/[0.08] focus:bg-white/10 focus:text-white [&>span:first-child]:hidden"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {category.name}
                          </span>
                          <span className="ml-auto flex size-4 shrink-0 items-center justify-center">
                            {category.id === selectedCategoryId ? (
                              <Check
                                className="size-4 text-white/60"
                                aria-hidden="true"
                              />
                            ) : null}
                          </span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <p className="mt-1.5 text-xs leading-5 text-white/55">
                  {t("popup.noCategories")}
                </p>
              )}

              {linkGroups.length > 0 ? (
                <div className="mt-2.5">
                  <label className="block text-xs font-medium text-white/65">
                    {t("popup.folderLabel")}
                  </label>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("popup.folderLabel")}
                        className="mt-1.5 flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-white/10 bg-white/[0.06] px-3 text-sm text-white outline-none transition-[color,box-shadow] focus-visible:border-blue-300/60 focus-visible:ring-[3px] focus-visible:ring-blue-300/20 data-[state=open]:border-blue-300/60 data-[state=open]:ring-[3px] data-[state=open]:ring-blue-300/20"
                      >
                        <span className="truncate">{selectedLinkGroupName}</span>
                        <ChevronDown
                          className="size-4 shrink-0 text-white/50"
                          aria-hidden="true"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      sideOffset={4}
                      className="z-[100] max-h-44 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-[10px] border-white/12 bg-[#1e1e22] p-1 text-white shadow-xl"
                    >
                      <DropdownMenuRadioGroup
                        value={selectedLinkGroupId}
                        onValueChange={setSelectedLinkGroupId}
                      >
                        <DropdownMenuRadioItem
                          value=""
                          className="h-8 cursor-pointer rounded-md px-2 data-[state=checked]:bg-white/[0.08] focus:bg-white/10 focus:text-white [&>span:first-child]:hidden"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {t("linkGroup.ungrouped")}
                          </span>
                          <span className="ml-auto flex size-4 shrink-0 items-center justify-center">
                            {selectedLinkGroupId === "" ? (
                              <Check
                                className="size-4 text-white/60"
                                aria-hidden="true"
                              />
                            ) : null}
                          </span>
                        </DropdownMenuRadioItem>
                        {linkGroups.map((group) => (
                          <DropdownMenuRadioItem
                            key={group.id}
                            value={group.id}
                            className="h-8 cursor-pointer rounded-md px-2 data-[state=checked]:bg-white/[0.08] focus:bg-white/10 focus:text-white [&>span:first-child]:hidden"
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {group.name}
                            </span>
                            <span className="ml-auto flex size-4 shrink-0 items-center justify-center">
                              {group.id === selectedLinkGroupId ? (
                                <Check
                                  className="size-4 text-white/60"
                                  aria-hidden="true"
                                />
                              ) : null}
                            </span>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : null}

              {isCategoryFormOpen ? (
                <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.035] p-2.5">
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
                    className="h-9 rounded-[10px] border-white/10 bg-white/[0.06] text-sm text-white placeholder:text-white/40 focus-visible:border-blue-300/60 focus-visible:ring-blue-300/20"
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
              ) : null}
            </div>

            <Button
              type="button"
              className="mt-3 h-10 w-full cursor-pointer rounded-xl border border-blue-300/20 bg-blue-500/85 px-4 text-sm text-white shadow-[0_8px_24px_rgba(59,130,246,0.2)] hover:bg-blue-400 focus-visible:border-blue-200/50 focus-visible:ring-blue-300/40"
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

          <div className="my-3 h-px bg-white/10" aria-hidden="true" />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="group h-10 min-w-0 flex-1 cursor-pointer justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white/85 hover:bg-white/[0.09] hover:text-white focus-visible:border-white/20 focus-visible:ring-white/20"
              onClick={handleOpenNewTab}
            >
              <Home className="text-blue-200/75 transition-colors group-hover:text-blue-100" />
              <span className="truncate font-medium">{t("popup.openNewTab")}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              title="lzt-T/localTab"
              aria-label={t("popup.githubAriaLabel")}
              className="group size-10 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] p-0 text-white/75 hover:bg-white/[0.09] hover:text-white focus-visible:border-white/20 focus-visible:ring-white/20"
              onClick={handleOpenGitHub}
            >
              <Github className="size-4 text-blue-200/75 transition-colors group-hover:text-blue-100" />
            </Button>
          </div>
        </main>

        <footer className="mt-3 border-t border-white/10 pt-2.5 text-center">
          <p className="text-xs font-medium text-white/55">{t("popup.tagline")}</p>
        </footer>
      </div>
      <Toaster position="top-center" />
    </div>
  );
};

export default PopupApp;
