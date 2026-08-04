import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { categoryService } from "@/services/categoryService";
import { categoryItemService } from "@/services/categoryItemService";
import type { Category } from "@/type/db";
import { getFaviconUrls } from "@/utils/webIcon";

// 快速创建分类使用的默认图标
const DEFAULT_CATEGORY_ICON = "folder";
// 快速收藏允许保存的网页协议
const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);
// 收藏成功提示显示时长（毫秒）
const POPUP_CLOSE_DELAY_MS = 1000;

// 浏览器活动标签页的必要字段
type ActiveTab = {
  title?: string;
  url?: string;
  favIconUrl?: string;
};

// 快速收藏加载状态
export type QuickBookmarkStatus =
  | "loading"
  | "ready"
  | "unsupported"
  | "error";

// 待收藏页面信息
export type QuickBookmarkPage = {
  title: string;
  url: string;
  icon: string;
};

// Chromium 扩展 API 最小类型声明
declare const chrome: {
  tabs: {
    query: (queryInfo: {
      active: boolean;
      currentWindow: boolean;
    }) => Promise<ActiveTab[]>;
  };
};

/** 将活动标签页转换为可收藏的 HTTP(S) 页面。 */
function buildQuickBookmarkPage(tab: ActiveTab | undefined): QuickBookmarkPage | null {
  if (!tab?.url) {
    return null;
  }

  try {
    // 当前标签页的规范 URL 对象
    const pageUrl = new URL(tab.url);
    if (!SUPPORTED_PROTOCOLS.has(pageUrl.protocol)) {
      return null;
    }

    // 浏览器缓存 favicon 或网站图标地址
    const fallbackIcon = getFaviconUrls(tab.url)[0] ?? "";
    return {
      title: tab.title?.trim() || pageUrl.hostname || tab.url,
      url: tab.url,
      icon: tab.favIconUrl || fallbackIcon,
    };
  } catch {
    return null;
  }
}

/** 管理扩展弹窗中的当前页面快速收藏流程。 */
export function useQuickBookmark() {
  // 本地化文案
  const { t } = useTranslation();
  // 活动页面加载状态
  const [status, setStatus] = useState<QuickBookmarkStatus>("loading");
  // 当前待收藏页面
  const [page, setPage] = useState<QuickBookmarkPage | null>(null);
  // 当前全部分类
  const [categories, setCategories] = useState<Category[]>([]);
  // 当前选择的目标分类
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  // 快速创建分类表单是否展开
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  // 新分类名称
  const [newCategoryName, setNewCategoryName] = useState("");
  // 新分类名称错误
  const [categoryNameError, setCategoryNameError] = useState("");
  // 分类创建提交状态
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  // 网址收藏提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 当前是否允许提交收藏
  const canBookmark =
    status === "ready" && Boolean(selectedCategoryId) && !isSubmitting;

  /** 展开快速创建分类表单。 */
  function openCategoryForm() {
    setCategoryNameError("");
    setIsCategoryFormOpen(true);
  }

  /** 关闭快速创建分类表单并清空输入。 */
  function closeCategoryForm() {
    setIsCategoryFormOpen(false);
    setNewCategoryName("");
    setCategoryNameError("");
  }

  /** 更新新分类名称并清除旧校验错误。 */
  function changeNewCategoryName(value: string) {
    setNewCategoryName(value);
    if (categoryNameError) {
      setCategoryNameError("");
    }
  }

  /** 创建默认图标分类并将其选为收藏目标。 */
  async function createCategory() {
    // 去除首尾空白后的分类名称
    const categoryName = newCategoryName.trim();
    if (!categoryName) {
      setCategoryNameError(t("category.nameRequired"));
      return;
    }

    setIsCreatingCategory(true);
    try {
      // 已创建并可直接选择的新分类
      const createdCategory = await categoryService.createCategory({
        name: categoryName,
        icon: DEFAULT_CATEGORY_ICON,
      });
      setCategories((currentCategories) => [
        ...currentCategories,
        createdCategory,
      ]);
      setSelectedCategoryId(createdCategory.id);
      closeCategoryForm();
      toast.success(t("popup.categoryCreated"));
    } catch {
      toast.error(t("popup.categoryCreateFailed"));
    } finally {
      setIsCreatingCategory(false);
    }
  }

  /** 将当前页面保存到所选分类。 */
  async function bookmarkCurrentPage() {
    if (!page || !selectedCategoryId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 目标分类是否已经包含当前完整地址
      const isAlreadyBookmarked =
        await categoryItemService.hasCategoryLinkUrl(
          selectedCategoryId,
          page.url
        );
      if (isAlreadyBookmarked) {
        toast.info(t("popup.alreadyBookmarked"));
        return;
      }

      await categoryItemService.createLink({
        title: page.title,
        description: "",
        url: page.url,
        icon: page.icon,
        parentId: selectedCategoryId,
      });
      toast.success(t("popup.bookmarkSuccess"));
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, POPUP_CLOSE_DELAY_MS);
      });
      window.close();
    } catch {
      toast.error(t("popup.bookmarkFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    /** 加载活动标签页和本地分类。 */
    async function loadQuickBookmark() {
      try {
        // 当前标签页和本地分类
        const [tabs, loadedCategories] = await Promise.all([
          chrome.tabs.query({ active: true, currentWindow: true }),
          categoryService.getAllCategories(),
        ]);
        // 可用于快速收藏的活动页面
        const activePage = buildQuickBookmarkPage(tabs[0]);
        setCategories(loadedCategories);
        setSelectedCategoryId(loadedCategories[0]?.id ?? "");
        setPage(activePage);
        setStatus(activePage ? "ready" : "unsupported");
      } catch {
        setStatus("error");
      }
    }

    loadQuickBookmark();
  }, []);

  return {
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
  };
}
