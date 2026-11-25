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
        className="size-8 shrink-0 rounded-[9px] object-contain"
        draggable={false}
        aria-hidden="true"
      />
      {!compact ? (
        <span className="hidden min-w-0 md:block">
          <span className="block truncate text-sm font-semibold tracking-[-0.02em] text-[var(--surface-text)]">
            LocalTab
          </span>
          <span className="block truncate text-[11px] font-medium text-[var(--surface-text-muted)]">
            Local workspace
          </span>
        </span>
      ) : null}
    </div>
  );
}
