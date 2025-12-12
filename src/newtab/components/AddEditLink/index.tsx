import { useState, useEffect, useCallback, useMemo } from "react";
import { LucideIconConfig } from "../../../utils/icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import _ from "lodash";
import { Loader2, Download } from "lucide-react";
import { fetchFavicon } from "@/utils/webIcon";

interface AddEditLinkProps {
  open: boolean;
  mode: "add" | "edit";
  initialData?: {
    title: string;
    description: string;
    url: string;
    icon: string;
  };
  handleClose: () => void;
  handleSubmit: (values: {
    title: string;
    description: string;
    url: string;
    icon: string;
  }) => void;
}

export default function AddEditLink(props: AddEditLinkProps) {
  const { open, mode, initialData, handleClose, handleSubmit } = props;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    url?: string;
    icon?: string;
  }>({});
  const [isLoadingFavicon, setIsLoadingFavicon] = useState(false);
  const [iconType, setIconType] = useState<"favicon" | "lucide">("lucide");

  const sheetTitle = useMemo(() => {
    return mode === "add" ? "添加链接" : "编辑链接";
  }, [mode]);

  const sheetDescription = useMemo(() => {
    return mode === "add" ? "创建一个新的链接" : "修改链接信息";
  }, [mode]);

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
    }, 500),
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
    }, 500),
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
    }, 500),
    []
  );

  /* 获取并设置 favicon */
  const onFetchFavicon = useCallback(async () => {
    if (!url.trim()) {
      return;
    }

    setIsLoadingFavicon(true);
    // 切换到 favicon 模式
    setIconType("favicon");

    try {
      const faviconUrl = await fetchFavicon(url.trim());
      if (faviconUrl) {
        setIcon(faviconUrl);
      }
    } catch (error) {
      console.error("获取 favicon 失败:", error);
    } finally {
      setIsLoadingFavicon(false);
    }
  }, [url]);

  /* 验证表单 */
  const onValidate = useCallback(() => {
    const newErrors: {
      title?: string;
      description?: string;
      url?: string;
      icon?: string;
    } = {};

    if (!title.trim()) {
      newErrors.title = "请输入链接标题";
    }

    if (!url.trim()) {
      newErrors.url = "请输入链接地址";
    } else {
      // 验证URL格式
      try {
        new URL(url.startsWith("http") ? url : `https://${url}`);
      } catch {
        newErrors.url = "请输入有效的URL格式";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, url]);

  const onOk = useCallback(() => {
    if (onValidate()) {
      // 自动添加 https:// 前缀（如果用户没有输入）
      const finalUrl = url.trim().startsWith("http")
        ? url.trim()
        : `https://${url.trim()}`;
      handleSubmit({ title, description, url: finalUrl, icon });
      handleClose();
    }
  }, [title, description, url, icon, handleSubmit, onValidate, handleClose]);

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

  // 当抽屉状态改变时，重置或初始化表单数据
  useEffect(() => {
    if (open) {
      // 抽屉打开时，根据模式初始化表单
      if (mode === "edit" && initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        setUrl(initialData.url);
        setIcon(initialData.icon);
        // 判断图标类型
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
      }
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="[&>button]:hidden">
        <SheetHeader>
          <SheetTitle>{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4 px-4">
          <div className="grid gap-2">
            <Label htmlFor="title">链接标题</Label>
            <Input
              key={`title-${open}`}
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
              key={`description-${open}`}
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
                key={`url-${open}`}
                id="url"
                type="url"
                placeholder="https://example.com"
                defaultValue={url}
                onChange={onUrlChange}
                className={errors.url ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onFetchFavicon}
                disabled={!url.trim() || isLoadingFavicon}
                title="获取网站图标"
              >
                {isLoadingFavicon ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="icon">图标</Label>
            <Tabs
              value={iconType}
              onValueChange={(value) => {
                const newType = value as "favicon" | "lucide";
                setIconType(newType);
                if (newType === "favicon") {
                  if (!icon || !icon.startsWith("http")) {
                    setIcon("");
                  }
                } else {
                  if (icon && icon.startsWith("http")) {
                    setIcon("link");
                  }
                }
              }}
            >
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
                    <>
                      <img
                        src={icon}
                        alt="网站图标"
                        className="w-6 h-6 rounded"
                        onError={() => setIcon("")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIcon("")}
                      >
                        清除
                      </Button>
                    </>
                  ) : (
                    <div className="flex-1 text-sm text-muted-foreground">
                      点击上方"获取网站图标"按钮获取网站图标
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="lucide" className="mt-2">
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
                    {Object.entries(LucideIconConfig).map(([key, Icon]) => (
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
                    ))}
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
