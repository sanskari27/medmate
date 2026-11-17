import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ChipProps = ComponentProps<"span"> & {
  active?: boolean;
};

export function Chip({ className, active = false, ...props }: ChipProps) {
  return (
    <span
      data-slot="chip"
      data-active={active ? "true" : "false"}
      className={cn(
        "inline-flex items-center rounded-pill border px-3 py-1 text-[12.5px] font-semibold",
        active ? "border-green bg-mint-100 text-forest" : "border-line-2 bg-surface text-ink-2",
        className,
      )}
      {...props}
    />
  );
}
