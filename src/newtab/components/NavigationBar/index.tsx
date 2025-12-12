import Icon from '../Icon';
import { Plus } from 'lucide-react';
import type { category } from '../../../type/db';
import { cn } from '../../../utils/base';
import { EllipsisVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { useCallback } from 'react';

interface NavigationBarProps {
  activeCategoryId: string;
  categories: category[];
  changeCurrentCategory: (categoryId: string) => void;
  addCategory: () => void;
  handleEditClick: (categoryId: string) => void;
  handleDeleteClick: (categoryId: string) => void;
}
export default function Index(props: NavigationBarProps) {
  const { activeCategoryId, categories, changeCurrentCategory, addCategory, handleEditClick, handleDeleteClick } =
    props;

  /* 编辑分类 */
  const onEditClick = useCallback(
    (categoryId: string) => {
      handleEditClick(categoryId);
    },
    [handleEditClick]
  );

  /* 删除分类 */
  const onDeleteClick = useCallback(
    (categoryId: string) => {
      handleDeleteClick(categoryId);
    },
    [handleDeleteClick]
  );

  return (
    <div className="relative w-full">
      <div
        className="flex flex-col items-center gap-3 w-full h-fit max-h-[70vh] overflow-y-auto overflow-x-visible"
        style={{ scrollbarWidth: 'none' }}
      >
        {categories.map((category, index) => (
          <div
            key={category.id + '_' + index}
            className="group/item relative w-full flex items-center justify-between cursor-pointer"
            onClick={() => changeCurrentCategory(category.id)}
          >
            <div className="flex h-12 items-center gap-1 flex-1 min-w-0 overflow-x-hidden pl-3">
              <button
                className={cn(
                  'flex shrink-0 items-center justify-center w-10 h-10 rounded-full group-hover/item:bg-white/20 group-hover/item:scale-110 text-white/70 hover:text-white transition-all duration-300 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                  activeCategoryId === category.id ? 'glass-style' : ''
                )}
                aria-label={category.name}
              >
                <Icon name={category.icon} size={20} />
              </button>
              <div className="flex-1 min-w-0 text-left px-3 py-1.5 text-white/90 text-sm font-medium -translate-x-2 group-hover/item:translate-x-0 transition-all duration-200 overflow-hidden text-ellipsis whitespace-nowrap">
                {category.name}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <EllipsisVertical size={18} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-24" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => onEditClick(category.id)}>
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => onDeleteClick(category.id)}>
                    删除
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* 添加按钮 */}
      <div className="flex justify-start mt-4 pl-3">
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-300 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
          aria-label="添加分类"
          onClick={addCategory}
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
