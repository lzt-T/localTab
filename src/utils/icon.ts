import * as LucideIcons from 'lucide-react';

// 链接图标来源类型
export const LINK_ICON_TYPE = {
  FAVICON: 'favicon',
  LUCIDE: 'lucide',
  CUSTOM: 'custom'
} as const;

// 链接图标来源类型值
export type LinkIconType = typeof LINK_ICON_TYPE[keyof typeof LINK_ICON_TYPE];

// 自定义图标文件选择器支持的格式
export const CUSTOM_ICON_ACCEPT = 'image/png,image/jpeg,image/webp';

// 自定义图标允许的最大源文件大小
export const MAX_CUSTOM_ICON_FILE_SIZE = 5 * 1024 * 1024;

// 自定义图标支持的 MIME 类型
const CUSTOM_ICON_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp'
]);

// 自定义图标压缩后的最长边
const CUSTOM_ICON_MAX_DIMENSION = 128;

// 自定义图标 WebP 输出质量
const CUSTOM_ICON_OUTPUT_QUALITY = 0.85;

// Lucide 图标名称与组件映射
export const LucideIconConfig = {
  house: LucideIcons.House,
  bookmark: LucideIcons.Bookmark,
  settings: LucideIcons.Settings,
  user: LucideIcons.User,
  file: LucideIcons.File,
  folder: LucideIcons.Folder,
  mail: LucideIcons.Mail,
  messageSquare: LucideIcons.MessageSquare,
  search: LucideIcons.Search,
  heart: LucideIcons.Heart,
  star: LucideIcons.Star,
  shoppingCart: LucideIcons.ShoppingCart,
  image: LucideIcons.Image,
  video: LucideIcons.Video,
  music: LucideIcons.Music,
  gamepad2: LucideIcons.Gamepad2,
  code: LucideIcons.Code,
  database: LucideIcons.Database,
  cloud: LucideIcons.Cloud,
  download: LucideIcons.Download,
  upload: LucideIcons.Upload,
  link: LucideIcons.Link,
  map: LucideIcons.Map,
  calendar: LucideIcons.Calendar,
  clock: LucideIcons.Clock,
  wrench: LucideIcons.Wrench,
  package: LucideIcons.Package,
  coffee: LucideIcons.Coffee,
  pizza: LucideIcons.Pizza,
  rocket: LucideIcons.Rocket,
  bell: LucideIcons.Bell,
  book: LucideIcons.Book,
  bookOpen: LucideIcons.BookOpen,
  bookMarked: LucideIcons.BookMarked,
};

/** 判断图标是否为远程图片地址。 */
export function isRemoteImageIcon(icon: string): boolean {
  return icon.startsWith('http://') || icon.startsWith('https://');
}

/** 判断图标是否来自 Chromium favicon 接口。 */
export function isBrowserFaviconIcon(icon: string): boolean {
  try {
    return (
      icon.startsWith('chrome-extension://') &&
      new URL(icon).pathname === '/_favicon/'
    );
  } catch {
    return false;
  }
}

/** 判断图标是否为网站图片地址。 */
export function isFaviconImageIcon(icon: string): boolean {
  return isRemoteImageIcon(icon) || isBrowserFaviconIcon(icon);
}

/** 判断图标是否为本地自定义图片数据。 */
export function isCustomImageIcon(icon: string): boolean {
  return icon.startsWith('data:image/');
}

/** 判断图标是否应当作为图片渲染。 */
export function isImageIcon(icon: string): boolean {
  return isFaviconImageIcon(icon) || isCustomImageIcon(icon);
}

/** 根据已保存的图标值识别图标来源。 */
export function getLinkIconType(icon: string): LinkIconType {
  if (isCustomImageIcon(icon)) {
    return LINK_ICON_TYPE.CUSTOM;
  }

  if (isFaviconImageIcon(icon)) {
    return LINK_ICON_TYPE.FAVICON;
  }

  return LINK_ICON_TYPE.LUCIDE;
}

/** 判断文件是否为支持的自定义图标格式。 */
export function isSupportedCustomIconFile(file: File): boolean {
  return CUSTOM_ICON_MIME_TYPES.has(file.type);
}

/** 将自定义图标等比缩小并转换为 WebP Data URL。 */
export async function createCustomIconDataUrl(file: File): Promise<string> {
  // 浏览器解码后的原始图片
  const imageBitmap = await createImageBitmap(file);

  try {
    // 图片最长边
    const longestDimension = Math.max(imageBitmap.width, imageBitmap.height);
    // 不放大图片的等比缩放比例
    const scale = Math.min(1, CUSTOM_ICON_MAX_DIMENSION / longestDimension);
    // 压缩后的图片宽度
    const targetWidth = Math.max(1, Math.round(imageBitmap.width * scale));
    // 压缩后的图片高度
    const targetHeight = Math.max(1, Math.round(imageBitmap.height * scale));
    // 用于压缩图片的画布
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 画布的二维绘图上下文
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('无法创建图标画布');
    }

    context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    return canvas.toDataURL('image/webp', CUSTOM_ICON_OUTPUT_QUALITY);
  } finally {
    imageBitmap.close();
  }
}
