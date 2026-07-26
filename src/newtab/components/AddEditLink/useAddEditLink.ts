import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { CategoryInfo } from "@/type/db";
import _ from "lodash";
import { fetchFavicon } from "@/utils/webIcon";
import { toast } from "sonner";
import {
  createCustomIconDataUrl,
  getLinkIconType,
  isCustomImageIcon,
  isRemoteImageIcon,
  isSupportedCustomIconFile,
  LINK_ICON_TYPE,
  MAX_CUSTOM_ICON_FILE_SIZE,
  type LinkIconType,
} from "@/utils/icon";

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
  }) => void;
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
  // 当前图标来源类型
  const [iconType, setIconType] = useState<LinkIconType>(
    LINK_ICON_TYPE.LUCIDE
  );

  // 当前模式对应的抽屉标题
  const sheetTitle = t(mode === "add" ? "link.addTitle" : "link.editTitle");
  // 当前模式对应的抽屉说明
  const sheetDescription = t(
    mode === "add" ? "link.addDescription" : "link.editDescription"
  );
  // 当前分类中可选择的网址分组
  const availableLinkGroups =
    categories.find((category) => category.id === categoryId)?.linkGroups ?? [];

  /* 获取并设置 favicon */
  const onFetchFavicon = useCallback(async () => {
    if (!url.trim()) {
      return;
    }

    setIsLoadingFavicon(true);

    try {
      // 根据网址获取的网站图标地址
      const faviconUrl = await fetchFavicon(url.trim());
      if (faviconUrl) {
        setIcon(faviconUrl);
      } else {
        setIcon("");
        toast.warning(t("link.faviconFailed"));
      }
    } catch {
      setIcon("");
      toast.warning(t("link.faviconFailed"));
    } finally {
      setIsLoadingFavicon(false);
    }
  }, [url, t]);

  /* 监听标题变化 */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onTitleChange = useCallback(
    _.debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      setErrors((prev) => {
        if (prev.title) {
          return { ...prev, title: undefined };
        }
        return prev;
      });
    }, 200),
    []
  );

  /* 监听描述变化 */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onDescriptionChange = useCallback(
    _.debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      setDescription(e.target.value);
      setErrors((prev) => {
        if (prev.description) {
          return { ...prev, description: undefined };
        }
        return prev;
      });
    }, 200),
    []
  );

  /* 监听URL变化 */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onUrlChange = useCallback(
    _.debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      setUrl(e.target.value);
      setErrors((prev) => {
        if (prev.url) {
          return { ...prev, url: undefined };
        }
        return prev;
      });

      if (
        iconType === LINK_ICON_TYPE.FAVICON &&
        e.target.value.startsWith("http")
      ) {
        onFetchFavicon();
      }
    }, 200),
    [iconType, onFetchFavicon]
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

  /** 校验并提交网址表单。 */
  const onOk = useCallback(() => {
    if (isProcessingCustomIcon) {
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
      handleSubmit({ title, description, url: finalUrl, icon, parentId });
      handleClose();
    }
  }, [
    title,
    description,
    url,
    icon,
    categoryId,
    linkGroupId,
    handleSubmit,
    onValidate,
    handleClose,
    isProcessingCustomIcon,
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
    (open: boolean) => {
      if (!open) {
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
        !isRemoteImageIcon(icon)
      ) {
        onFetchFavicon();
      }

      if (
        nextIconType === LINK_ICON_TYPE.LUCIDE &&
        (getLinkIconType(icon) !== LINK_ICON_TYPE.LUCIDE || !icon)
      ) {
        setIcon("link");
      }

      if (
        nextIconType === LINK_ICON_TYPE.CUSTOM &&
        !isCustomImageIcon(icon)
      ) {
        setIcon("");
      }
    },
    [icon, onFetchFavicon]
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
    if (open) {
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
        setIcon("link");
        setIconType(LINK_ICON_TYPE.LUCIDE);
        // 默认父级对应的网址分组
        const defaultLinkGroup = categories
          .flatMap((category) => category.linkGroups)
          .find((linkGroup) => linkGroup.id === defaultParentId);
        setCategoryId(defaultLinkGroup?.parentId ?? defaultParentId);
        setLinkGroupId(defaultLinkGroup?.id ?? NO_LINK_GROUP_VALUE);
      }
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    onCustomIconSelect,
    onRemoveCustomIcon,
    onCategoryChange,
  };
}


