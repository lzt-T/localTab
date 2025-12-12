import { useCallback } from 'react';
import { LucideIconConfig } from '../../../utils/icon';

interface IconProps {
  name: string;
  size?: number;
}

export default function Icon({ name, size }: IconProps) {
  /* 获取图标 */
  const getIcon = useCallback(() => {
    const Icon = LucideIconConfig[name as keyof typeof LucideIconConfig];
    if (!Icon) {
      return null;
    }
    return <Icon size={size} />;
  }, [name, size]);

  return getIcon();
}
