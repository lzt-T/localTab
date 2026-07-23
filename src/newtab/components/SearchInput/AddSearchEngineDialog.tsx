import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface AddSearchEngineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, searchUrl: string) => Promise<void>;
}

interface SearchEngineFormErrors {
  name?: string;
  searchUrl?: string;
}

// 搜索引擎表单输入框样式
const INPUT_CLASS_NAME =
  "border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:border-blue-300/60 focus-visible:ring-blue-300/20";

/**
 * 添加自定义搜索引擎弹窗。
 */
export default function AddSearchEngineDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddSearchEngineDialogProps) {
  // 国际化工具
  const { t } = useTranslation();
  // 搜索引擎名称
  const [name, setName] = useState("");
  // 搜索地址模板
  const [searchUrl, setSearchUrl] = useState("");
  // 表单错误
  const [errors, setErrors] = useState<SearchEngineFormErrors>({});

  /**
   * 更新搜索引擎名称。
   */
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    if (errors.name) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        name: undefined,
      }));
    }
  };

  /**
   * 更新搜索地址模板。
   */
  const onSearchUrlChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchUrl(event.target.value);
    if (errors.searchUrl) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        searchUrl: undefined,
      }));
    }
  };

  /**
   * 校验并提交搜索引擎。
   */
  const onFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 去除空白后的名称
    const trimmedName = name.trim();
    // 去除空白后的搜索地址
    const trimmedSearchUrl = searchUrl.trim();
    // 下一次表单错误
    const nextErrors: SearchEngineFormErrors = {};

    if (!trimmedName) {
      nextErrors.name = t("search.nameRequired");
    }

    if (!trimmedSearchUrl) {
      nextErrors.searchUrl = t("search.urlRequired");
    } else {
      // 关键词占位符数量
      const placeholderCount = trimmedSearchUrl.split("%s").length - 1;
      if (placeholderCount !== 1) {
        nextErrors.searchUrl = t("search.urlTemplateRequired");
      } else {
        try {
          // 解析后的搜索地址
          const parsedSearchUrl = new URL(trimmedSearchUrl);
          if (!["http:", "https:"].includes(parsedSearchUrl.protocol)) {
            nextErrors.searchUrl = t("search.invalidUrl");
          }
        } catch {
          nextErrors.searchUrl = t("search.invalidUrl");
        }
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(trimmedName, trimmedSearchUrl);
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      setName("");
      setSearchUrl("");
      setErrors({});
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-style-border border-white/15 bg-[rgba(32,34,38,0.96)] text-white shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <form className="space-y-5" onSubmit={onFormSubmit}>
          <DialogHeader>
            <DialogTitle>{t("search.addTitle")}</DialogTitle>
            <DialogDescription className="text-white/60">
              {t("search.addDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-white/85"
                htmlFor="search-engine-name"
              >
                {t("search.name")}
              </label>
              <Input
                id="search-engine-name"
                value={name}
                className={INPUT_CLASS_NAME}
                placeholder={t("search.namePlaceholder")}
                aria-invalid={Boolean(errors.name)}
                onChange={onNameChange}
              />
              {errors.name ? (
                <p className="text-xs text-red-300">{errors.name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-white/85"
                htmlFor="search-engine-url"
              >
                {t("search.searchUrl")}
              </label>
              <Input
                id="search-engine-url"
                value={searchUrl}
                className={INPUT_CLASS_NAME}
                placeholder="https://example.com/search?q=%s"
                aria-invalid={Boolean(errors.searchUrl)}
                onChange={onSearchUrlChange}
              />
              {errors.searchUrl ? (
                <p className="text-xs text-red-300">{errors.searchUrl}</p>
              ) : (
                <p className="text-xs text-white/45">
                  {t("search.urlTemplateHint")}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-white text-slate-950 hover:bg-white/90"
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
