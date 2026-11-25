import { Image as ImageIcon, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import IconPickerGrid from "@/newtab/components/IconPickerGrid";
import FileDropZone from "@/newtab/components/Setting/FileDropZone";
import {
  CUSTOM_ICON_ACCEPT,
  isCustomImageIcon,
  isFaviconImageIcon,
  LINK_ICON_TYPE,
  type LinkIconType,
} from "@/utils/icon";

// 图标错误信息的稳定标识
const ICON_ERROR_ID = "link-icon-error";

interface LinkIconSelectorProps {
  icon: string;
  iconType: LinkIconType;
  isLoadingFavicon: boolean;
  isProcessingCustomIcon: boolean;
  canRetryFavicon: boolean;
  error?: string;
  onIconChange: (icon: string) => void;
  onIconTypeChange: (iconType: string) => void;
  onRetryFavicon: () => void;
  onCustomIconSelect: (file: File) => void | Promise<void>;
  onRemoveCustomIcon: () => void;
}

/** 渲染网站图标、Lucide 图标和自定义图标选择器。 */
export default function LinkIconSelector({
  icon,
  iconType,
  isLoadingFavicon,
  isProcessingCustomIcon,
  canRetryFavicon,
  error,
  onIconChange,
  onIconTypeChange,
  onRetryFavicon,
  onCustomIconSelect,
  onRemoveCustomIcon,
}: LinkIconSelectorProps) {
  // 图标选择器的本地化文案
  const { t } = useTranslation();
  // 当前是否已有可预览的自定义图标
  const hasCustomIcon = isCustomImageIcon(icon);

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="mb-4 text-sm font-semibold text-white/90">
        {t("link.iconSection")}
      </legend>
      <Tabs value={iconType} onValueChange={onIconTypeChange}>
        <TabsList className="grid h-11 w-full grid-cols-3 border border-white/10 bg-black/15">
          <TabsTrigger
            value={LINK_ICON_TYPE.FAVICON}
            disabled={isProcessingCustomIcon}
            className="h-9 min-w-0 cursor-pointer px-2 text-white/60 data-[state=active]:border-white/10 data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <span className="truncate">{t("link.favicon")}</span>
          </TabsTrigger>
          <TabsTrigger
            value={LINK_ICON_TYPE.LUCIDE}
            disabled={isProcessingCustomIcon}
            className="h-9 min-w-0 cursor-pointer px-2 text-white/60 data-[state=active]:border-white/10 data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <span className="truncate">{t("link.lucideIcon")}</span>
          </TabsTrigger>
          <TabsTrigger
            value={LINK_ICON_TYPE.CUSTOM}
            disabled={isProcessingCustomIcon}
            className="h-9 min-w-0 cursor-pointer px-2 text-white/60 data-[state=active]:border-white/10 data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <span className="truncate">{t("link.customIcon")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={LINK_ICON_TYPE.FAVICON} className="mt-3">
          <div className="flex min-h-11 w-full items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {icon && isFaviconImageIcon(icon) ? (
                <div className="flex size-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] backdrop-blur-xl">
                  <img
                    src={icon}
                    alt={t("link.favicon")}
                    className="size-8 rounded object-contain"
                    onError={() => onIconChange("")}
                  />
                </div>
              ) : (
                isLoadingFavicon && (
                  <div
                    className="flex items-center gap-2 text-sm text-white/60"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2
                      className="size-5 animate-spin"
                      aria-hidden="true"
                    />
                    <span>{t("link.faviconLoading")}</span>
                  </div>
                )
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canRetryFavicon || isLoadingFavicon}
              onClick={onRetryFavicon}
              className="h-9 shrink-0 cursor-pointer border-white/15 bg-white/[0.04] text-xs text-white/80 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={14}
                className={cn(isLoadingFavicon && "animate-spin")}
                aria-hidden="true"
              />
              {t("link.retryFavicon")}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value={LINK_ICON_TYPE.LUCIDE} className="mt-3">
          <IconPickerGrid
            value={icon}
            onChange={onIconChange}
            label={t("link.selectIcon")}
            errorId={error ? ICON_ERROR_ID : undefined}
            hasError={Boolean(error)}
          />
        </TabsContent>

        <TabsContent value={LINK_ICON_TYPE.CUSTOM} className="mt-3">
          <div className="space-y-3">
            {hasCustomIcon && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-white/[0.06]">
                    <img
                      src={icon}
                      alt={t("link.customIconPreview")}
                      className="size-10 object-contain"
                      onError={onRemoveCustomIcon}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white/85">
                      {t("link.customIconPreview")}
                    </p>
                    <p className="text-xs text-white/55">
                      {t("link.customIconReady")}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessingCustomIcon}
                  className="shrink-0 cursor-pointer border-red-400/25 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-white"
                  onClick={onRemoveCustomIcon}
                >
                  <Trash2 size={15} />
                  {t("link.removeCustomIcon")}
                </Button>
              </div>
            )}

            <FileDropZone
              accept={CUSTOM_ICON_ACCEPT}
              title={t(
                hasCustomIcon
                  ? "link.replaceCustomIcon"
                  : "link.selectCustomIcon"
              )}
              description={t("link.customIconSupportedFormats")}
              disabled={isProcessingCustomIcon}
              onFileSelect={onCustomIconSelect}
            />

            {isProcessingCustomIcon && (
              <div
                className="flex items-center gap-2 text-sm text-white/60"
                role="status"
                aria-live="polite"
              >
                <Loader2
                  className="size-5 animate-spin"
                  aria-hidden="true"
                />
                <span>{t("link.customIconProcessing")}</span>
              </div>
            )}

            {!hasCustomIcon && !isProcessingCustomIcon && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <ImageIcon size={15} aria-hidden="true" />
                <span>{t("link.customIconOptional")}</span>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <p id={ICON_ERROR_ID} className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </fieldset>
  );
}
