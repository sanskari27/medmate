import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const dividerVariants = cva("bg-line", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "w-px self-stretch",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export type DividerProps = ComponentProps<"div"> & VariantProps<typeof dividerVariants>;

export function Divider({ className, orientation, ...props }: DividerProps) {
  return (
    <div
      data-slot="divider"
      role="separator"
      aria-orientation={orientation ?? "horizontal"}
      className={cn(dividerVariants({ orientation }), className)}
      {...props}
    />
  );
}

export { dividerVariants };
