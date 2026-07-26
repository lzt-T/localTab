interface LocalTabMarkProps {
  className?: string;
  compact?: boolean;
}

/** 渲染与浏览器扩展一致的 LocalTab 品牌标记。 */
export default function LocalTabMark({
  className,
  compact = false,
}: LocalTabMarkProps) {
  return (
    <div className={className} aria-label="LocalTab">
      <img
        src="/icons/icon.svg"
        alt=""
        className="size-10 shrink-0 rounded-[10px] object-contain"
        draggable={false}
        aria-hidden="true"
      />
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-[-0.02em] text-white">
            LocalTab
          </span>
          <span className="block truncate text-[11px] font-medium text-white/55">
            Local workspace
          </span>
        </span>
      ) : null}
    </div>
  );
}
