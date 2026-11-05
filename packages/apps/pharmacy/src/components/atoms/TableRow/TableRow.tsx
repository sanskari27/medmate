import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const tableRowVariants = cva("", {
  variants: {
    align: {
      left: "text-left",
      right: "text-right tabular-nums",
    },
  },
});

export type TableRowProps = ComponentProps<"tr"> & VariantProps<typeof tableRowVariants>;

export function TableRow({ className, align, ...props }: TableRowProps) {
  return (
    <tr data-slot="table-row" className={cn(tableRowVariants({ align }), className)} {...props} />
  );
}
