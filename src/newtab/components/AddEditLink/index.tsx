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
import type { Category } from "@/type/db";
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
import { useAddEditLink } from "@/newtab/components/AddEditLink/useAddEditLink";

const FIELD_CLASS_NAME =
  "border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:border-blue-300/60 focus-visible:ring-blue-300/20";
const SELECT_CONTENT_CLASS_NAME =
  "border-white/15 bg-[rgba(32,34,38,0.98)] text-white shadow-xl backdrop-blur-2xl";
const SELECT_ITEM_CLASS_NAME =
  "cursor-pointer focus:bg-white/10 focus:text-white";

interface AddEditLinkProps {
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

export default function AddEditLink(props: AddEditLinkProps) {
  const { t } = useTranslation();
  const {
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
    setParentId,
    setErrors,
    setIcon,
    onTitleChange,
    onDescriptionChange,
    onUrlChange,
    onOk,
    onCancel,
    onOpenChange,
    onTabChange,
  } = useAddEditLink(props);

  return (
    <Sheet open={props.open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="border-white/15 bg-[rgba(32,34,38,0.94)] text-white shadow-2xl shadow-black/40 backdrop-blur-2xl [&>button]:rounded-md [&>button]:bg-transparent [&>button]:p-1.5 [&>button]:text-white/70 [&>button]:hover:bg-white/10 [&>button]:hover:text-white"
      >
        <SheetHeader className="border-b border-white/10 bg-black/10">
          <SheetTitle className="text-white">{sheetTitle}</SheetTitle>
          <SheetDescription className="text-white/60">
            {sheetDescription}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4 px-4">
          <div className="grid gap-2">
            <Label htmlFor="category" className="text-white/80">
              {t("link.category")}
            </Label>
            <Select
              value={parentId}
              onValueChange={(value) => {
                setParentId(value);
                setErrors((prev) => ({ ...prev, parentId: undefined }));
              }}
            >
              <SelectTrigger
                id="category"
                className={cn(
                  "w-full cursor-pointer [&_svg]:text-white/50",
                  FIELD_CLASS_NAME,
                  errors.parentId ? "border-red-500" : ""
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
              <p className="text-sm text-red-500">{errors.parentId}</p>
            )}
          </div>

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
              className={cn(
                FIELD_CLASS_NAME,
                errors.title ? "border-red-500" : ""
              )}
              maxLength={50}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
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
              className={cn(
                FIELD_CLASS_NAME,
                errors.description ? "border-red-500" : ""
              )}
              maxLength={100}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url" className="text-white/80">
              {t("link.url")}
            </Label>
            <div className="flex gap-2">
              <Input
                key={`url-${props.open}`}
                id="url"
                type="url"
                placeholder="https://example.com"
                defaultValue={url}
                onChange={onUrlChange}
                className={cn(
                  FIELD_CLASS_NAME,
                  errors.url ? "border-red-500" : ""
                )}
              />
            </div>
            {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="icon" className="text-white/80">
              {t("common.icon")}
            </Label>
            <Tabs value={iconType} onValueChange={onTabChange}>
              <TabsList className="w-full border border-white/10 bg-black/20">
                <TabsTrigger
                  value="favicon"
                  className="flex-1 cursor-pointer text-white/60 data-[state=active]:border-white/10 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                >
                  {t("link.favicon")}
                </TabsTrigger>
                <TabsTrigger
                  value="lucide"
                  className="flex-1 cursor-pointer text-white/60 data-[state=active]:border-white/10 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                >
                  {t("link.lucideIcon")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="favicon" className="mt-2">
                <div className="flex items-center gap-2 w-full">
                  {icon && icon.startsWith("http") ? (
                    <div className="rounded-md border border-white/15 w-11 h-11 bg-white/[0.06] backdrop-blur-xl flex items-center justify-center">
                      <img
                        src={icon}
                        alt={t("link.favicon")}
                        className="w-8 h-8 rounded"
                        onError={() => setIcon("")}
                      />
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-center pt-2">
                      {isLoadingFavicon && (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="lucide" className="mt-2 cursor-pointer">
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger
                    id="icon"
                    className={cn(
                      "w-full cursor-pointer [&_svg]:text-white/50",
                      FIELD_CLASS_NAME,
                      errors.icon ? "border-red-500" : ""
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
                    {Object.entries(LucideIconConfig).map(([key, IconComponent]) => {
                      const Icon = IconComponent as React.ComponentType<{ size?: number }>;
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
                    })}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
            {errors.icon && (
              <p className="text-sm text-red-500">{errors.icon}</p>
            )}
          </div>
        </div>
        <SheetFooter className="border-t border-white/10 bg-black/10">
          <Button
            variant="outline"
            className="cursor-pointer border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
            onClick={onCancel}
          >
            {t("common.cancel")}
          </Button>
          <Button
            className="cursor-pointer bg-blue-500/80 text-white hover:bg-blue-400 focus-visible:ring-blue-300/40"
            onClick={onOk}
          >
            {t("common.confirm")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
