import { cn } from "@/lib/utils";
import { isImageIcon } from "@/utils/icon";

type MonogramSize = "sm" | "md" | "lg";

interface LinkMonogramProps {
  title: string;
  url: string;
  size?: MonogramSize;
}

// 与深色哑光玻璃图标块同源的低饱和微彩渐变配色表（按站点哈希稳定分配）
const MONOGRAM_TONES = [
  "border-slate-300/18 bg-gradient-to-br from-slate-700/72 via-zinc-800/76 to-zinc-900/84 text-slate-200",
  "border-sky-300/18 bg-gradient-to-br from-sky-900/68 via-slate-900/76 to-zinc-900/84 text-sky-200",
  "border-emerald-300/18 bg-gradient-to-br from-emerald-900/66 via-slate-900/76 to-zinc-900/84 text-emerald-200",
  "border-amber-300/18 bg-gradient-to-br from-amber-900/66 via-stone-900/76 to-zinc-900/84 text-amber-200",
  "border-indigo-300/18 bg-gradient-to-br from-indigo-900/68 via-slate-900/76 to-zinc-900/84 text-indigo-200",
  "border-rose-300/18 bg-gradient-to-br from-rose-900/66 via-zinc-900/76 to-zinc-900/84 text-rose-200",
] as const;

// 不同尺寸对应的徽标容器与阴影样式（lg 与 .glass-icon-tile 对齐）
const MONOGRAM_SIZE_CLASS: Record<MonogramSize, string> = {
  lg: "size-[60px] rounded-[18px] text-[21px] shadow-[0_8px_20px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.14)]",
  md: "size-7 rounded-lg text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
  sm: "size-full rounded-[5px] text-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]",
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

/** 根据标题与网址计算稳定的莫兰迪配色索引。 */
function getMonogramToneClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return MONOGRAM_TONES[hash % MONOGRAM_TONES.length];
}

/** 渲染深色哑光玻璃质感的首字徽标作为默认图标与失败回退。 */
export default function LinkMonogram({
  title,
  url,
  size = "md",
}: LinkMonogramProps) {
  // 徽标展示的单个字符
  const character = getMonogramCharacter(title, url);
  // 徽标对应的稳定低饱和微彩渐变配色
  const toneClass = getMonogramToneClass(`${title}|${url}`);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center border font-semibold leading-none tracking-[-0.02em] backdrop-blur-[10px] select-none",
        MONOGRAM_SIZE_CLASS[size],
        toneClass
      )}
    >
      {character}
    </span>
  );
}
