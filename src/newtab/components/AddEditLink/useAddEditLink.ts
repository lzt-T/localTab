import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Category } from "@/type/db";
import _ from "lodash";
import { fetchFavicon } from "@/utils/webIcon";
import { toast } from "sonner";

interface UseAddEditLinkProps {
  open: boolean;
  mode: "add" | "edit";
  initialData?: {
    title: string;
    description: string;
    url: string;
    icon: string;
    parentId: string;
  };
  categories: Category[];
  defaultCategoryId: string;
  handleClose: () => void;
  handleSubmit: (values: {
    title: string;
    description: string;
    url: string;
    icon: string;
    parentId: string;
  }) => void;
}

interface Errors {
  title?: string;
  description?: string;
  url?: string;
  icon?: string;
  parentId?: string;
}

export function useAddEditLink(props: UseAddEditLinkProps) {
  const { open, mode, initialData, categories, defaultCategoryId, handleClose, handleSubmit } = props;
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState(defaultCategoryId);
  const [errors, setErrors] = useState<Errors>({});
  const [isLoadingFavicon, setIsLoadingFavicon] = useState(false);
  const [iconType, setIconType] = useState<"favicon" | "lucide">("lucide");

  const sheetTitle = t(mode === "add" ? "link.addTitle" : "link.editTitle");
  const sheetDescription = t(
    mode === "add" ? "link.addDescription" : "link.editDescription"
  );

  /* 获取并设置 favicon */
  const onFetchFavicon = useCallback(async () => {
    if (!url.trim()) {
      return;
    }

    setIsLoadingFavicon(true);

    try {
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

      if (iconType === "favicon" && e.target.value.startsWith("http")) {
        onFetchFavicon();
      }
    }, 200),
    [iconType, onFetchFavicon]
  );

  /* 验证表单 */
  const onValidate = useCallback(() => {
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

    if (!parentId) {
      newErrors.parentId = t("link.selectCategory");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, url, parentId, t]);

  const onOk = useCallback(() => {
    if (onValidate()) {
      const finalUrl = url.trim().startsWith("http")
        ? url.trim()
        : `https://${url.trim()}`;
      handleSubmit({ title, description, url: finalUrl, icon, parentId });
      handleClose();
    }
  }, [title, description, url, icon, parentId, handleSubmit, onValidate, handleClose]);

  const onCancel = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose]
  );

  /* 切换图标类型 */
  const onTabChange = useCallback(
    (value: string) => {
      setIconType(value as "favicon" | "lucide");
      if (value === "favicon" && !icon.startsWith("http")) {
        onFetchFavicon();
      }

      if (value === "lucide" && (icon.startsWith("http") || !icon)) {
        setIcon("link");
      }
    },
    [icon, onFetchFavicon]
  );

  // 当抽屉状态改变时，重置或初始化表单数据
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        setUrl(initialData.url);
        setIcon(initialData.icon);
        setParentId(initialData.parentId);
        if (initialData.icon && initialData.icon.startsWith("http")) {
          setIconType("favicon");
        } else {
          setIconType("lucide");
        }
      } else {
        setTitle("");
        setDescription("");
        setUrl("");
        setIcon("link");
        setIconType("lucide");
        setParentId(defaultCategoryId);
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
    parentId,
    errors,
    isLoadingFavicon,
    iconType,
    sheetTitle,
    sheetDescription,
    categories,
    // Setters
    setParentId,
    setErrors,
    setIcon,
    // Handlers
    onTitleChange,
    onDescriptionChange,
    onUrlChange,
    onOk,
    onCancel,
    onOpenChange,
    onTabChange,
  };
}


