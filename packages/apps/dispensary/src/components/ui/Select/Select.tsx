import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-10 rounded-sm border border-line-2 bg-paper px-3 text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus",
        className,
      )}
      {...props}
    />
  );
}
