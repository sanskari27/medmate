import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const labelVariants = cva("font-bold tracking-[0.01em] text-ink-2", {
  variants: {
    size: {
      sm: "text-[11px]",
      md: "text-[11.5px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type LabelProps = ComponentProps<"label"> & VariantProps<typeof labelVariants>;

export function Label({ className, size, ...props }: LabelProps) {
  return <label data-slot="label" className={cn(labelVariants({ size }), className)} {...props} />;
}

export { labelVariants };
