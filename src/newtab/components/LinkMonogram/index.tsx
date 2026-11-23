import { cn } from "@/lib/utils";
import { isImageIcon } from "@/utils/icon";

type MonogramSize = "sm" | "md";

interface LinkMonogramProps {
  title: string;
  url: string;
  size?: MonogramSize;
}

// 低饱和微雾配色表（同一站点通过哈希稳定命中同一色调）
const MONOGRAM_TONES = [
  "border-blue-300/20 bg-blue-400/16 text-blue-100",
  "border-cyan-300/20 bg-cyan-400/16 text-cyan-100",
  "border-indigo-300/20 bg-indigo-400/16 text-indigo-100",
  "border-emerald-300/20 bg-emerald-400/16 text-emerald-100",
  "border-amber-300/20 bg-amber-400/16 text-amber-100",
  "border-rose-300/20 bg-rose-400/16 text-rose-100",
] as const;

// 不同尺寸对应的徽标容器样式
const MONOGRAM_SIZE_CLASS: Record<MonogramSize, string> = {
  md: "size-7 rounded-lg text-xs",
  sm: "size-full rounded-sm text-[9px]",
};

/** 判断网址当前是否应显示首字徽标而非 Lucide 图标或图片。 */
export function shouldUseLinkMonogram(
  icon: string,
  failedImageIcon: string
): boolean {
  if (!icon || icon === "link") {
    return true;
  }
  return isImageIcon(icon) && failedImageIcon === icon;
}

/** 从标题或主机名提取首个有效展示字符。 */
function getMonogramCharacter(title: string, url: string): string {
  // 去除首尾空白后的标题首个字符
  const titleFirstChar = Array.from(title.trim())[0];
  if (titleFirstChar) {
    return titleFirstChar.toUpperCase();
  }

  try {
    // 去掉 www. 前缀的主机名首字符
    const hostname = new URL(url).hostname.replace(/^www\./i, "");
    const hostFirstChar = Array.from(hostname)[0];
    if (hostFirstChar) {
      return hostFirstChar.toUpperCase();
    }
  } catch {
    // 忽略非法 URL，回退默认符号
  }

  return "?";
}

/** 根据标题与网址计算稳定的低饱和配色索引。 */
function getMonogramToneClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return MONOGRAM_TONES[hash % MONOGRAM_TONES.length];
}

/** 渲染克制的低饱和首字徽标作为默认图标与失败回退。 */
export default function LinkMonogram({
  title,
  url,
  size = "md",
}: LinkMonogramProps) {
  // 徽标展示的单个字符
  const character = getMonogramCharacter(title, url);
  // 徽标对应的稳定低饱和配色
  const toneClass = getMonogramToneClass(`${title}|${url}`);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center border font-semibold leading-none select-none",
        MONOGRAM_SIZE_CLASS[size],
        toneClass
      )}
    >
      {character}
    </span>
  );
}
