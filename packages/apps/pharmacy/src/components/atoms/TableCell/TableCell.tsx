import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const tableCellVariants = cva("px-3 py-2 text-ink", {
  variants: {
    align: {
      left: "text-left",
      right: "text-right tabular-nums",
    },
  },
});

export type TableCellProps = ComponentProps<"td"> & VariantProps<typeof tableCellVariants>;

export function TableCell({ className, align, ...props }: TableCellProps) {
  return (
    <td data-slot="table-cell" className={cn(tableCellVariants({ align }), className)} {...props} />
  );
}
