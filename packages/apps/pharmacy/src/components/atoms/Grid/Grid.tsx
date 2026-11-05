import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const gridVariants = cva("grid", {
  variants: {
    columns: {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      split: "grid-cols-1 md:grid-cols-2",
    },
    gap: {
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
    },
  },
  defaultVariants: {
    columns: 2,
    gap: 4,
  },
});

export type GridProps = ComponentProps<"div"> & VariantProps<typeof gridVariants>;

export function Grid({ className, columns, gap, ...props }: GridProps) {
  return (
    <div data-slot="grid" className={cn(gridVariants({ columns, gap }), className)} {...props} />
  );
}

export { gridVariants };
