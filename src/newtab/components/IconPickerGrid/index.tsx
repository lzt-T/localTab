import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { LucideIconConfig } from "@/utils/icon";

interface IconPickerGridProps {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
  errorId?: string;
  hasError?: boolean;
}

/** 渲染紧凑的 Lucide 图标网格选择器。 */
export default function IconPickerGrid({
  value,
  onChange,
  label,
  errorId,
  hasError = false,
}: IconPickerGridProps) {
  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={errorId}
      className={cn(
        "grid max-h-52 grid-cols-6 gap-1.5 overflow-y-auto rounded-xl border border-white/15 bg-white/[0.04] p-2",
        hasError && "border-red-400"
      )}
    >
      {Object.entries(LucideIconConfig).map(([key, IconComponent]) => {
        // 当前图标组件
        const Icon = IconComponent as ComponentType<{ size?: number }>;
        // 当前图标是否处于选中状态
        const isSelected = value === key;

        return (
          <button
            key={key}
            type="button"
            title={key}
            aria-label={key}
            aria-pressed={isSelected}
            onClick={() => onChange(key)}
            className={cn(
              "flex h-10 cursor-pointer items-center justify-center rounded-lg border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-300/60",
              isSelected
                ? "border-blue-300/60 bg-blue-400/20 text-blue-100"
                : "border-transparent bg-transparent text-white/65 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}
