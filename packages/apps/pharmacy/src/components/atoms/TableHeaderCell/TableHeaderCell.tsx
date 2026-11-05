import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const tableHeaderCellVariants = cva("px-3 py-2 text-[11px] font-bold text-muted", {
  variants: {
    align: {
      left: "text-left",
      right: "text-right tabular-nums",
    },
  },
});

export type TableHeaderCellProps = ComponentProps<"th"> &
  VariantProps<typeof tableHeaderCellVariants>;

export function TableHeaderCell({ className, align, ...props }: TableHeaderCellProps) {
  return (
    <th
      data-slot="table-header-cell"
      className={cn(tableHeaderCellVariants({ align }), className)}
      {...props}
    />
  );
}
