import { cn } from "@/lib/utils";
import { isImageIcon } from "@/utils/icon";

type MonogramSize = "sm" | "md" | "lg";

interface LinkMonogramProps {
  title: string;
  url: string;
  size?: MonogramSize;
}

// 莫兰迪质感微渐变玻璃配色表（按站点哈希稳定分配）
const MONOGRAM_TONES = [
  "border-white/22 bg-gradient-to-br from-slate-500/82 to-slate-700/88 text-white shadow-[0_6px_16px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.28)]",
  "border-white/22 bg-gradient-to-br from-sky-500/78 to-blue-600/85 text-white shadow-[0_6px_16px_rgba(14,165,233,0.18),inset_0_1px_0_rgba(255,255,255,0.28)]",
  "border-white/22 bg-gradient-to-br from-emerald-500/76 to-teal-600/84 text-white shadow-[0_6px_16px_rgba(16,185,129,0.16),inset_0_1px_0_rgba(255,255,255,0.28)]",
  "border-white/22 bg-gradient-to-br from-amber-500/78 to-orange-600/84 text-white shadow-[0_6px_16px_rgba(245,158,11,0.16),inset_0_1px_0_rgba(255,255,255,0.28)]",
  "border-white/22 bg-gradient-to-br from-violet-500/76 to-indigo-600/84 text-white shadow-[0_6px_16px_rgba(139,92,246,0.18),inset_0_1px_0_rgba(255,255,255,0.28)]",
  "border-white/22 bg-gradient-to-br from-rose-500/76 to-pink-600/84 text-white shadow-[0_6px_16px_rgba(244,63,94,0.16),inset_0_1px_0_rgba(255,255,255,0.28)]",
] as const;

// 不同尺寸对应的徽标容器样式
const MONOGRAM_SIZE_CLASS: Record<MonogramSize, string> = {
  lg: "size-[60px] rounded-[18px] text-[22px]",
  md: "size-7 rounded-lg text-xs",
  sm: "size-full rounded-[5px] text-[10px]",
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

/** 渲染莫兰迪玻璃质感的首字徽标作为默认图标与失败回退。 */
export default function LinkMonogram({
  title,
  url,
  size = "md",
}: LinkMonogramProps) {
  // 徽标展示的单个字符
  const character = getMonogramCharacter(title, url);
  // 徽标对应的稳定莫兰迪渐变配色
  const toneClass = getMonogramToneClass(`${title}|${url}`);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center border font-semibold leading-none backdrop-blur-md select-none",
        MONOGRAM_SIZE_CLASS[size],
        toneClass
      )}
    >
      {character}
    </span>
  );
}
