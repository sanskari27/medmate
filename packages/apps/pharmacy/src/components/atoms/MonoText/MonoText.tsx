import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const monoTextVariants = cva("font-mono text-ink tabular-nums", {
  variants: {
    size: {
      sm: "text-[11.5px]",
      md: "text-[13px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type MonoTextProps = ComponentProps<"span"> & VariantProps<typeof monoTextVariants>;

export function MonoText({ className, size, ...props }: MonoTextProps) {
  return <span data-slot="mono-text" className={cn(monoTextVariants({ size }), className)} {...props} />;
}

export { monoTextVariants };
