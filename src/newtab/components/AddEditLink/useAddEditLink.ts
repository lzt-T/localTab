import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { CategoryInfo } from "@/type/db";
import { fetchFavicon, isFetchableWebsiteUrl } from "@/utils/webIcon";
import { toast } from "sonner";
import {
  createCustomIconDataUrl,
  getLinkIconType,
  isCustomImageIcon,
  isFaviconImageIcon,
  isSupportedCustomIconFile,
  LINK_ICON_TYPE,
  MAX_CUSTOM_ICON_FILE_SIZE,
  type LinkIconType,
} from "@/utils/icon";

// 网址输入框变更后延迟获取 favicon 的防抖毫秒数
const FAVICON_FETCH_DEBOUNCE_MS = 300;

interface UseAddEditLinkProps {
  open: boolean;
  mode: "add" | "edit";
  initialData?: {
    title: string;
    description: string;
    url: string;
    icon: string;
    categoryId: string;
    linkGroupId: string;
  };
  categories: CategoryInfo[];
  defaultParentId: string;
  handleClose: () => void;
  handleSubmit: (values: {
    title: string;
    description: string;
    url: string;
    icon: string;
    parentId: string;
  }) => void | Promise<void>;
}

// 未选择网址分组时使用的表单值
export const NO_LINK_GROUP_VALUE = "__ungrouped__";

interface Errors {
  title?: string;
  description?: string;
  url?: string;
  icon?: string;
  parentId?: string;
}

interface FetchFaviconOptions {
  silent?: boolean;
}

/** 管理网址添加和编辑抽屉的表单状态。 */
export function useAddEditLink(props: UseAddEditLinkProps) {
  // 网址表单属性
  const {
    open,
    mode,
    initialData,
    categories,
    defaultParentId,
    handleClose,
    handleSubmit,
  } = props;
  // 网址表单的本地化文案
  const { t } = useTranslation();

  // 网址标题
  const [title, setTitle] = useState("");
  // 网址描述
  const [description, setDescription] = useState("");
  // 网址地址
  const [url, setUrl] = useState("");
  // 网址图标
  const [icon, setIcon] = useState("");
  // 当前选择的分类
  const [categoryId, setCategoryId] = useState("");
  // 当前选择的网址分组
  const [linkGroupId, setLinkGroupId] = useState(NO_LINK_GROUP_VALUE);
  // 当前表单校验错误
  const [errors, setErrors] = useState<Errors>({});
  // 网站图标是否正在加载
  const [isLoadingFavicon, setIsLoadingFavicon] = useState(false);
  // 自定义图标是否正在处理
  const [isProcessingCustomIcon, setIsProcessingCustomIcon] = useState(false);
  // 表单提交中状态，防止重复提交
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 当前图标来源类型
  const [iconType, setIconType] = useState<LinkIconType>(
    LINK_ICON_TYPE.FAVICON
  );
  // 网址变更触发 favicon 请求的防抖定时器
  const faviconTimerRef = useRef<number | null>(null);
  // 递增请求版本号与中止控制器，避免旧异步响应覆盖新输入
  const faviconRequestIdRef = useRef(0);
  const faviconAbortControllerRef = useRef<AbortController | null>(null);

  // 当前模式对应的抽屉标题
  const sheetTitle = t(mode === "add" ? "link.addTitle" : "link.editTitle");
  // 当前模式对应的抽屉说明
  const sheetDescription = t(
    mode === "add" ? "link.addDescription" : "link.editDescription"
  );
  // 当前分类中可选择的网址分组
  const availableLinkGroups =
    categories.find((category) => category.id === categoryId)?.linkGroups ?? [];

  /** 清理尚未触发的 favicon 防抖定时器。 */
  const clearPendingFaviconFetch = useCallback(() => {
    if (faviconTimerRef.current !== null) {
      window.clearTimeout(faviconTimerRef.current);
      faviconTimerRef.current = null;
    }
  }, []);

  /** 中止进行中的 favicon 探测并使未返回请求失效。 */
  const abortActiveFaviconFetch = useCallback(() => {
    faviconRequestIdRef.current += 1;
    if (faviconAbortControllerRef.current) {
      faviconAbortControllerRef.current.abort();
      faviconAbortControllerRef.current = null;
    }
    setIsLoadingFavicon(false);
  }, []);

  /** 获取并设置指定网址的 favicon，自动忽略过期请求。 */
  const onFetchFavicon = useCallback(
    async (
      targetUrl: string = url,
      options: FetchFaviconOptions = {}
    ) => {
      const { silent = false } = options;
      const trimmedTargetUrl = targetUrl.trim();
      if (!trimmedTargetUrl || !isFetchableWebsiteUrl(trimmedTargetUrl)) {
        if (!silent) {
          toast.warning(t("link.invalidUrl"));
        }
        return;
      }

      abortActiveFaviconFetch();
      const requestId = faviconRequestIdRef.current;
      const controller = new AbortController();
      faviconAbortControllerRef.current = controller;
      setIsLoadingFavicon(true);

      try {
        // 根据网址并发探测可用的网站图标地址
        const faviconUrl = await fetchFavicon(
          trimmedTargetUrl,
          controller.signal
        );
        if (requestId !== faviconRequestIdRef.current) {
          return;
        }
        if (faviconUrl) {
          setIcon(faviconUrl);
        } else {
          setIcon("");
          if (!silent) {
            toast.warning(t("link.faviconFailed"));
          }
        }
      } catch {
        if (requestId !== faviconRequestIdRef.current) {
          return;
        }
        setIcon("");
        if (!silent) {
          toast.warning(t("link.faviconFailed"));
        }
      } finally {
        if (requestId === faviconRequestIdRef.current) {
          faviconAbortControllerRef.current = null;
          setIsLoadingFavicon(false);
        }
      }
    },
    [abortActiveFaviconFetch, t, url]
  );

  /** 手动重新触发当前输入网址的图标探测（失败时给出提示）。 */
  const onRetryFavicon = useCallback(() => {
    clearPendingFaviconFetch();
    void onFetchFavicon(url, { silent: false });
  }, [clearPendingFaviconFetch, onFetchFavicon, url]);

  /** 实时更新标题并清除标题校验错误。 */
  const onTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(event.target.value);
      setErrors((prev) => (prev.title ? { ...prev, title: undefined } : prev));
    },
    []
  );

  /** 实时更新描述并清除描述校验错误。 */
  const onDescriptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDescription(event.target.value);
      setErrors((prev) =>
        prev.description ? { ...prev, description: undefined } : prev
      );
    },
    []
  );

  /** 实时更新网址，并按防抖周期静默获取 favicon。 */
  const onUrlChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // 最新输入的网址
      const nextUrl = event.target.value;
      setUrl(nextUrl);
      setErrors((prev) => (prev.url ? { ...prev, url: undefined } : prev));

      clearPendingFaviconFetch();
      if (iconType === LINK_ICON_TYPE.FAVICON && isFetchableWebsiteUrl(nextUrl)) {
        faviconTimerRef.current = window.setTimeout(() => {
          faviconTimerRef.current = null;
          void onFetchFavicon(nextUrl, { silent: true });
        }, FAVICON_FETCH_DEBOUNCE_MS);
      } else {
        abortActiveFaviconFetch();
      }
    },
    [
      abortActiveFaviconFetch,
      clearPendingFaviconFetch,
      iconType,
      onFetchFavicon,
    ]
  );

  /* 验证表单 */
  const onValidate = useCallback(() => {
    // 当前校验产生的错误
    const newErrors: Errors = {};

    if (!title.trim()) {
      newErrors.title = t("link.titleRequired");
    }

    if (!url.trim()) {
      newErrors.url = t("link.urlRequired");
    } else {
      try {
        new URL(url.startsWith("http") ? url : `https://${url}`);
      } catch {
        newErrors.url = t("link.invalidUrl");
      }
    }

    if (!categoryId) {
      newErrors.parentId = t("link.selectCategory");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, url, categoryId, t]);

  /** 校验并异步提交网址表单，成功后再关闭抽屉。 */
  const onOk = useCallback(async () => {
    if (isProcessingCustomIcon || isSubmitting) {
      return;
    }

    if (onValidate()) {
      // 补全协议后的网址地址
      const finalUrl = url.trim().startsWith("http")
        ? url.trim()
        : `https://${url.trim()}`;
      // 网址最终保存的父级标识
      const parentId =
        linkGroupId === NO_LINK_GROUP_VALUE ? categoryId : linkGroupId;

      setIsSubmitting(true);
      try {
        await handleSubmit({ title, description, url: finalUrl, icon, parentId });
        handleClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [
    isProcessingCustomIcon,
    isSubmitting,
    onValidate,
    url,
    linkGroupId,
    categoryId,
    handleSubmit,
    title,
    description,
    icon,
    handleClose,
  ]);

  /** 切换所属分类并重置分组选择。 */
  const onCategoryChange = useCallback((value: string) => {
    setCategoryId(value);
    setLinkGroupId(NO_LINK_GROUP_VALUE);
    setErrors((previousErrors) => ({
      ...previousErrors,
      parentId: undefined,
    }));
  }, []);

  /** 关闭网址表单。 */
  const onCancel = useCallback(() => {
    handleClose();
  }, [handleClose]);

  /** 同步抽屉关闭操作。 */
  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        handleClose();
      }
    },
    [handleClose]
  );

  /** 切换图标来源类型并初始化对应值。 */
  const onIconTypeChange = useCallback(
    (value: string) => {
      // 用户选择的图标来源类型
      const nextIconType = value as LinkIconType;
      setIconType(nextIconType);

      if (
        nextIconType === LINK_ICON_TYPE.FAVICON &&
        !isFaviconImageIcon(icon)
      ) {
        if (isFetchableWebsiteUrl(url)) {
          void onFetchFavicon(url, { silent: true });
        } else {
          setIcon("");
        }
      }

      if (
        nextIconType === LINK_ICON_TYPE.LUCIDE &&
        (getLinkIconType(icon) !== LINK_ICON_TYPE.LUCIDE || !icon)
      ) {
        clearPendingFaviconFetch();
        abortActiveFaviconFetch();
        setIcon("link");
      }

      if (
        nextIconType === LINK_ICON_TYPE.CUSTOM &&
        !isCustomImageIcon(icon)
      ) {
        clearPendingFaviconFetch();
        abortActiveFaviconFetch();
        setIcon("");
      }
    },
    [
      abortActiveFaviconFetch,
      clearPendingFaviconFetch,
      icon,
      onFetchFavicon,
      url,
    ]
  );

  /** 校验、压缩并设置用户上传的自定义图标。 */
  const onCustomIconSelect = useCallback(
    async (file: File) => {
      if (!isSupportedCustomIconFile(file)) {
        toast.error(t("link.customIconInvalidFile"));
        return;
      }

      if (file.size > MAX_CUSTOM_ICON_FILE_SIZE) {
        toast.error(t("link.customIconTooLarge"));
        return;
      }

      setIsProcessingCustomIcon(true);
      try {
        // 压缩后可持久化的自定义图标数据
        const customIconDataUrl = await createCustomIconDataUrl(file);
        setIcon(customIconDataUrl);
      } catch {
        toast.error(t("link.customIconProcessingFailed"));
      } finally {
        setIsProcessingCustomIcon(false);
      }
    },
    [t]
  );

  /** 移除当前自定义图标。 */
  const onRemoveCustomIcon = useCallback(() => {
    setIcon("");
  }, []);

  // 当抽屉状态改变时，重置或初始化表单数据
  useEffect(() => {
    if (!open) {
      clearPendingFaviconFetch();
      abortActiveFaviconFetch();
      return;
    }
    if (mode === "edit" && initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setUrl(initialData.url);
      setIcon(initialData.icon);
      setCategoryId(initialData.categoryId);
      setLinkGroupId(initialData.linkGroupId || NO_LINK_GROUP_VALUE);
      setIconType(getLinkIconType(initialData.icon));
    } else {
      setTitle("");
      setDescription("");
      setUrl("");
      setIcon("");
      setIconType(LINK_ICON_TYPE.FAVICON);
      // 默认父级对应的网址分组
      const defaultLinkGroup = categories
        .flatMap((category) => category.linkGroups)
        .find((linkGroup) => linkGroup.id === defaultParentId);
      setCategoryId(defaultLinkGroup?.parentId ?? defaultParentId);
      setLinkGroupId(defaultLinkGroup?.id ?? NO_LINK_GROUP_VALUE);
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clearPendingFaviconFetch, abortActiveFaviconFetch]);

  useEffect(() => {
    return () => {
      clearPendingFaviconFetch();
      abortActiveFaviconFetch();
    };
  }, [abortActiveFaviconFetch, clearPendingFaviconFetch]);

  return {
    // State
    title,
    description,
    url,
    icon,
    categoryId,
    linkGroupId,
    errors,
    isLoadingFavicon,
    isProcessingCustomIcon,
    isSubmitting,
    canRetryFavicon: isFetchableWebsiteUrl(url),
    iconType,
    sheetTitle,
    sheetDescription,
    categories,
    availableLinkGroups,
    // Setters
    setLinkGroupId,
    setIcon,
    // Handlers
    onTitleChange,
    onDescriptionChange,
    onUrlChange,
    onOk,
    onCancel,
    onOpenChange,
    onIconTypeChange,
    onRetryFavicon,
    onCustomIconSelect,
    onRemoveCustomIcon,
    onCategoryChange,
  };
}
