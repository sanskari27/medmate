import type { HBarProps } from "./HBar.types";

export function HBar({ label, right, pct, color }: HBarProps) {
  return (
    <div className="mb-[11px]">
      <div className="mb-1 flex items-center justify-between gap-2.5 text-[12.5px]">
        <span className="font-semibold">{label}</span>
        <span className="text-muted">{right}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-[6px] bg-wash">
        <div
          className="h-full rounded-[6px] transition-[width] duration-[250ms]"
          style={{ width: `${Math.max(2, pct)}%`, background: color }}
        />
      </div>
    </div>
  );
}
