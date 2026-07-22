import { useState, useEffect, useMemo, useCallback } from 'react';
import { LucideIconConfig } from '@/utils/icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import _ from 'lodash';

const FIELD_CLASS_NAME =
  'border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:border-blue-300/60 focus-visible:ring-blue-300/20';
const SELECT_CONTENT_CLASS_NAME =
  'border-white/15 bg-[rgba(32,34,38,0.98)] text-white shadow-xl backdrop-blur-2xl';
const SELECT_ITEM_CLASS_NAME = 'cursor-pointer focus:bg-white/10 focus:text-white';

interface AddEditCategoryProps {
  open: boolean;
  mode: 'add' | 'edit';
  initialData?: {
    title: string;
    icon: string;
  };
  handleClose: () => void;
  handleSubmit: (values: { title: string; icon: string }) => void;
}

export default function AddEditCategory(props: AddEditCategoryProps) {
  const { open, mode, initialData, handleClose, handleSubmit } = props;

  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');
  const [errors, setErrors] = useState<{ title?: string; icon?: string }>({});

  const dialogTitle = useMemo(() => {
    return mode === 'add' ? '添加分类' : '编辑分类';
  }, [mode]);

  const dialogDescription = useMemo(() => {
    return mode === 'add' ? '创建一个新的分类来组织你的链接' : '修改分类信息';
  }, [mode]);

  /* 监听标题变化 */
  const onTitleChange = useCallback(
    _.debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      if (errors.title) {
        setErrors({ ...errors, title: undefined });
      }
    }, 200),
    []
  );

  /* 验证表单 */
  const onValidate = useCallback(() => {
    const newErrors: { title?: string; icon?: string } = {};

    if (!title.trim()) {
      newErrors.title = '请输入分类名称';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title]);

  const onOk = useCallback(() => {
    if (onValidate()) {
      handleSubmit({ title, icon });
      handleClose();
    }
  }, [title, icon, handleSubmit, onValidate, handleClose]);

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

  // 当对话框状态改变时，重置或初始化表单数据
  useEffect(() => {
    if (open) {
      // 对话框打开时，根据模式初始化表单
      if (mode === 'edit' && initialData) {
        setTitle(initialData.title);
        setIcon(initialData.icon);
      } else {
        setTitle('');
        setIcon('house');
      }
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/15 bg-[rgba(32,34,38,0.92)] text-white shadow-2xl shadow-black/40 backdrop-blur-2xl sm:max-w-[425px] [&_[data-slot=dialog-close]]:bg-transparent [&_[data-slot=dialog-close]]:text-white/70 [&_[data-slot=dialog-close]]:hover:bg-white/10 [&_[data-slot=dialog-close]]:hover:text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-white/60">{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-white/80">分类名称</Label>
            <Input
              id="title"
              placeholder="请输入分类名称"
              defaultValue={title}
              onChange={onTitleChange}
              className={cn(FIELD_CLASS_NAME, errors.title ? 'border-red-500' : '')}
              maxLength={10}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="icon" className="text-white/80">图标</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger
                id="icon"
                className={cn(
                  'w-full cursor-pointer [&_svg]:text-white/50',
                  FIELD_CLASS_NAME,
                  errors.icon ? 'border-red-500' : ''
                )}
              >
                <SelectValue placeholder="请选择图标" />
              </SelectTrigger>
              <SelectContent className={cn('max-h-[360px] overflow-y-auto', SELECT_CONTENT_CLASS_NAME)}>
                {Object.entries(LucideIconConfig).map(([key, Icon]) => (
                  <SelectItem key={key} value={key} className={SELECT_ITEM_CLASS_NAME}>
                    <div className="flex items-center gap-2">
                      <Icon size={16} />
                      <span>{key}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.icon && <p className="text-sm text-red-500">{errors.icon}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
            onClick={onCancel}
          >
            取消
          </Button>
          <Button
            className="cursor-pointer bg-blue-500/80 text-white hover:bg-blue-400 focus-visible:ring-blue-300/40"
            onClick={onOk}
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
