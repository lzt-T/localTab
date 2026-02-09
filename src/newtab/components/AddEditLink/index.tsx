import React from "react";
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
import { LucideIconConfig } from "../../../utils/icon";
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
import { useAddEditLink } from "./useAddEditLink";

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
      <SheetContent side="left" className="[\u0026>button]:hidden">
        <SheetHeader>
          <SheetTitle>{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4 px-4">
          <div className="grid gap-2">
            <Label htmlFor="category">所属分类</Label>
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
                  "w-full cursor-pointer",
                  errors.parentId ? "border-red-500" : ""
                )}
              >
                <SelectValue placeholder="请选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                    className="cursor-pointer"
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
            <Label htmlFor="title">链接标题</Label>
            <Input
              key={`title-${props.open}`}
              id="title"
              placeholder="请输入链接标题"
              defaultValue={title}
              onChange={onTitleChange}
              className={errors.title ? "border-red-500" : ""}
              maxLength={50}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">描述</Label>
            <Input
              key={`description-${props.open}`}
              id="description"
              placeholder="请输入链接描述（可选）"
              defaultValue={description}
              onChange={onDescriptionChange}
              className={errors.description ? "border-red-500" : ""}
              maxLength={100}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url">链接地址</Label>
            <div className="flex gap-2">
              <Input
                key={`url-${props.open}`}
                id="url"
                type="url"
                placeholder="https://example.com"
                defaultValue={url}
                onChange={onUrlChange}
                className={errors.url ? "border-red-500" : ""}
              />
            </div>
            {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="icon">图标</Label>
            <Tabs value={iconType} onValueChange={onTabChange}>
              <TabsList className="w-full">
                <TabsTrigger value="favicon" className="flex-1">
                  网站图标
                </TabsTrigger>
                <TabsTrigger value="lucide" className="flex-1">
                  Lucide 图标
                </TabsTrigger>
              </TabsList>
              <TabsContent value="favicon" className="mt-2">
                <div className="flex items-center gap-2 w-full">
                  {icon && icon.startsWith("http") ? (
                    <div className="rounded-md border-2 border-border w-11 h-11 bg-white/10 backdrop-blur-xl flex items-center justify-center">
                      <img
                        src={icon}
                        alt="网站图标"
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
                      "w-full cursor-pointer",
                      errors.icon ? "border-red-500" : ""
                    )}
                  >
                    <SelectValue placeholder="请选择图标" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[360px] overflow-y-auto">
                    {Object.entries(LucideIconConfig).map(([key, IconComponent]) => {
                      const Icon = IconComponent as React.ComponentType<{ size?: number }>;
                      return (
                        <SelectItem
                          key={key}
                          value={key}
                          className="cursor-pointer"
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
        <SheetFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onCancel}
          >
            取消
          </Button>
          <Button className="cursor-pointer" onClick={onOk}>
            确定
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
