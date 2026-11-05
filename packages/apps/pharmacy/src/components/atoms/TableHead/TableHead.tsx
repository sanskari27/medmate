import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const tableHeadVariants = cva("", {
  variants: {
    align: {
      left: "text-left",
      right: "text-right tabular-nums",
    },
  },
});

export type TableHeadProps = ComponentProps<"thead"> & VariantProps<typeof tableHeadVariants>;

export function TableHead({ className, align, ...props }: TableHeadProps) {
  return (
    <thead
      data-slot="table-head"
      className={cn(tableHeadVariants({ align }), className)}
      {...props}
    />
  );
}
