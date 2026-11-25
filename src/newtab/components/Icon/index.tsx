import { memo } from "react";
import { LucideIconConfig } from "@/utils/icon";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

/** 渲染预置的 Lucide 图标组件。 */
function Icon({ name, size, className = "" }: IconProps) {
  const IconComponent = LucideIconConfig[name as keyof typeof LucideIconConfig];
  if (!IconComponent) {
    return null;
  }
  return <IconComponent size={size} className={className} />;
}

export default memo(Icon);
