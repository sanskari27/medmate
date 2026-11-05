import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const tableVariants = cva(
  "w-full border-separate border-spacing-0 text-left text-[13px] [&_td]:border-b [&_td]:border-line [&_th]:border-b [&_th]:border-line [&_tr:last-child_td]:!border-b-0 [&_tbody>tr]:transition-[background-color] [&_tbody>tr]:duration-100 [&_tbody>tr]:ease-[ease] [&_tbody>tr]:hover:bg-wash-2",
  {
    variants: {
      align: {
        left: "text-left",
        right: "text-right tabular-nums",
      },
    },
  },
);

export type TableProps = ComponentProps<"table"> & VariantProps<typeof tableVariants>;

export function Table({ className, align, ...props }: TableProps) {
  return <table data-slot="table" className={cn(tableVariants({ align }), className)} {...props} />;
}
