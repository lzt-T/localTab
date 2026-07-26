import React from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { CategoryInfo } from "@/type/db";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { LucideIconConfig } from "@/utils/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NO_LINK_GROUP_VALUE,
  useAddEditLink,
} from "@/newtab/components/AddEditLink/useAddEditLink";

// 网址表单字段的统一样式
const FIELD_CLASS_NAME =
  "h-11 border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:border-blue-300/60 focus-visible:ring-blue-300/20";
// 下拉内容的统一样式
const SELECT_CONTENT_CLASS_NAME =
  "glass-style-overlay text-white shadow-xl";
// 下拉选项的统一样式
const SELECT_ITEM_CLASS_NAME =
  "cursor-pointer focus:bg-white/10 focus:text-white";
// 网址表单错误信息与对应字段使用的稳定标识
const LINK_FORM_ERROR_IDS = {
  category: "link-category-error",
  title: "link-title-error",
  description: "link-description-error",
  url: "link-url-error",
  icon: "link-icon-error",
} as const;

interface AddEditLinkProps {
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

/** 渲染支持选择所属文件夹的网址浮动编辑侧板。 */
export default function AddEditLink(props: AddEditLinkProps) {
  // 网址表单的本地化文案
  const { t } = useTranslation();
  // 网址表单状态与操作
  const {
    title,
    description,
    url,
    icon,
    categoryId,
    linkGroupId,
    errors,
    isLoadingFavicon,
    iconType,
    sheetTitle,
    sheetDescription,
    categories,
    availableLinkGroups,
    setLinkGroupId,
    setIcon,
    onTitleChange,
    onDescriptionChange,
    onUrlChange,
    onOk,
    onCancel,
    onOpenChange,
    onTabChange,
    onCategoryChange,
  } = useAddEditLink(props);

  return (
    <Sheet open={props.open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="h-dvh w-full max-w-none gap-0 overflow-hidden rounded-none shadow-2xl shadow-black/40 sm:w-[clamp(30rem,38vw,33.75rem)] sm:max-w-none [&>button]:right-4 [&>button]:top-4 [&>button]:size-11 [&>button]:rounded-xl [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-white/70 [&>button]:hover:bg-white/10 [&>button]:hover:text-white"
      >
        <SheetHeader className="shrink-0 px-4 pb-4 pt-5 pr-16 sm:px-6 sm:pb-5 sm:pt-6 sm:pr-20">
          <SheetTitle className="text-lg leading-6 text-white">
            {sheetTitle}
          </SheetTitle>
          <SheetDescription className="text-white/60">
            {sheetDescription}
          </SheetDescription>
        </SheetHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            onOk();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            <div className="space-y-7">
              <fieldset className="min-w-0 border-0 p-0">
                <legend className="mb-4 text-sm font-semibold text-white/90">
                  {t("link.locationSection")}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="category" className="text-white/80">
                      {t("link.category")}
                    </Label>
                    <Select
                      value={categoryId}
                      onValueChange={onCategoryChange}
                    >
                      <SelectTrigger
                        id="category"
                        aria-invalid={Boolean(errors.parentId)}
                        aria-describedby={
                          errors.parentId
                            ? LINK_FORM_ERROR_IDS.category
                            : undefined
                        }
                        className={cn(
                          "w-full cursor-pointer [&_svg]:text-white/50",
                          FIELD_CLASS_NAME,
                          errors.parentId ? "border-red-400" : ""
                        )}
                      >
                        <SelectValue placeholder={t("link.selectCategory")} />
                      </SelectTrigger>
                      <SelectContent className={SELECT_CONTENT_CLASS_NAME}>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                            className={SELECT_ITEM_CLASS_NAME}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.parentId && (
                      <p
                        id={LINK_FORM_ERROR_IDS.category}
                        className="text-sm text-red-300"
                      >
                        {errors.parentId}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="link-group" className="text-white/80">
                      {t("link.group")}
                    </Label>
                    <Select
                      value={linkGroupId}
                      onValueChange={setLinkGroupId}
                    >
                      <SelectTrigger
                        id="link-group"
                        className={cn(
                          "w-full cursor-pointer [&_svg]:text-white/50",
                          FIELD_CLASS_NAME
                        )}
                      >
                        <SelectValue placeholder={t("link.selectGroup")} />
                      </SelectTrigger>
                      <SelectContent className={SELECT_CONTENT_CLASS_NAME}>
                        <SelectItem
                          value={NO_LINK_GROUP_VALUE}
                          className={SELECT_ITEM_CLASS_NAME}
                        >
                          {t("linkGroup.ungrouped")}
                        </SelectItem>
                        {availableLinkGroups.map((linkGroup) => (
                          <SelectItem
                            key={linkGroup.id}
                            value={linkGroup.id}
                            className={SELECT_ITEM_CLASS_NAME}
                          >
                            {linkGroup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </fieldset>

              <fieldset className="min-w-0 border-0 p-0">
                <legend className="mb-4 text-sm font-semibold text-white/90">
                  {t("link.detailsSection")}
                </legend>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-white/80">
                      {t("link.title")}
                    </Label>
                    <Input
                      key={`title-${props.open}`}
                      id="title"
                      placeholder={t("link.titlePlaceholder")}
                      defaultValue={title}
                      onChange={onTitleChange}
                      aria-invalid={Boolean(errors.title)}
                      aria-describedby={
                        errors.title ? LINK_FORM_ERROR_IDS.title : undefined
                      }
                      className={cn(
                        FIELD_CLASS_NAME,
                        errors.title ? "border-red-400" : ""
                      )}
                      maxLength={50}
                    />
                    {errors.title && (
                      <p
                        id={LINK_FORM_ERROR_IDS.title}
                        className="text-sm text-red-300"
                      >
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="url" className="text-white/80">
                      {t("link.url")}
                    </Label>
                    <Input
                      key={`url-${props.open}`}
                      id="url"
                      type="url"
                      placeholder="https://example.com"
                      defaultValue={url}
                      onChange={onUrlChange}
                      aria-invalid={Boolean(errors.url)}
                      aria-describedby={
                        errors.url ? LINK_FORM_ERROR_IDS.url : undefined
                      }
                      className={cn(
                        FIELD_CLASS_NAME,
                        errors.url ? "border-red-400" : ""
                      )}
                    />
                    {errors.url && (
                      <p
                        id={LINK_FORM_ERROR_IDS.url}
                        className="text-sm text-red-300"
                      >
                        {errors.url}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-white/80">
                      {t("link.description")}
                    </Label>
                    <Input
                      key={`description-${props.open}`}
                      id="description"
                      placeholder={t("link.descriptionPlaceholder")}
                      defaultValue={description}
                      onChange={onDescriptionChange}
                      aria-invalid={Boolean(errors.description)}
                      aria-describedby={
                        errors.description
                          ? LINK_FORM_ERROR_IDS.description
                          : undefined
                      }
                      className={cn(
                        FIELD_CLASS_NAME,
                        errors.description ? "border-red-400" : ""
                      )}
                      maxLength={100}
                    />
                    {errors.description && (
                      <p
                        id={LINK_FORM_ERROR_IDS.description}
                        className="text-sm text-red-300"
                      >
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset className="min-w-0 border-0 p-0">
                <legend className="mb-4 text-sm font-semibold text-white/90">
                  {t("link.iconSection")}
                </legend>
                <Tabs value={iconType} onValueChange={onTabChange}>
                  <TabsList className="h-11 w-full border border-white/10 bg-black/15">
                    <TabsTrigger
                      value="favicon"
                      className="h-9 flex-1 cursor-pointer text-white/60 data-[state=active]:border-white/10 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                    >
                      {t("link.favicon")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="lucide"
                      className="h-9 flex-1 cursor-pointer text-white/60 data-[state=active]:border-white/10 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                    >
                      {t("link.lucideIcon")}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="favicon" className="mt-3">
                    <div className="flex min-h-11 w-full items-center">
                      {icon && icon.startsWith("http") ? (
                        <div className="flex size-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] backdrop-blur-xl">
                          <img
                            src={icon}
                            alt={t("link.favicon")}
                            className="size-8 rounded"
                            onError={() => setIcon("")}
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
                            <span className="sr-only">
                              {t("link.faviconLoading")}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="lucide" className="mt-3 cursor-pointer">
                    <Select value={icon} onValueChange={setIcon}>
                      <SelectTrigger
                        id="icon"
                        aria-invalid={Boolean(errors.icon)}
                        aria-describedby={
                          errors.icon ? LINK_FORM_ERROR_IDS.icon : undefined
                        }
                        className={cn(
                          "w-full cursor-pointer [&_svg]:text-white/50",
                          FIELD_CLASS_NAME,
                          errors.icon ? "border-red-400" : ""
                        )}
                      >
                        <SelectValue placeholder={t("link.selectIcon")} />
                      </SelectTrigger>
                      <SelectContent
                        className={cn(
                          "max-h-[360px] overflow-y-auto",
                          SELECT_CONTENT_CLASS_NAME
                        )}
                      >
                        {Object.entries(LucideIconConfig).map(
                          ([key, IconComponent]) => {
                            // 当前配置对应的图标组件
                            const Icon =
                              IconComponent as React.ComponentType<{
                                size?: number;
                              }>;
                            return (
                              <SelectItem
                                key={key}
                                value={key}
                                className={SELECT_ITEM_CLASS_NAME}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon size={16} />
                                  <span>{key}</span>
                                </div>
                              </SelectItem>
                            );
                          }
                        )}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                </Tabs>
                {errors.icon && (
                  <p
                    id={LINK_FORM_ERROR_IDS.icon}
                    className="mt-2 text-sm text-red-300"
                  >
                    {errors.icon}
                  </p>
                )}
              </fieldset>
            </div>
          </div>
          <SheetFooter className="shrink-0 flex-row border-t border-white/[0.08] px-4 py-4 sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 cursor-pointer border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white sm:flex-none sm:w-24"
              onClick={onCancel}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="h-11 flex-[1.4] cursor-pointer bg-blue-500/80 text-white hover:bg-blue-400 focus-visible:ring-blue-300/40 sm:flex-none sm:w-28"
            >
              {t("common.confirm")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
