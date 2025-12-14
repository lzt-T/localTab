import { useCallback } from "react";
import { LucideIconConfig } from "../../../utils/icon";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function Icon({ name, size, className = "" }: IconProps) {
  /* 获取图标 */
  const getIcon = useCallback(() => {
    const Icon = LucideIconConfig[name as keyof typeof LucideIconConfig];
    if (!Icon) {
      return null;
    }
    return <Icon size={size} className={className} />;
  }, [name, size, className]);

  return getIcon();
}
