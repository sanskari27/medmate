import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const tableBodyVariants = cva("", {
  variants: {
    align: {
      left: "text-left",
      right: "text-right tabular-nums",
    },
  },
});

export type TableBodyProps = ComponentProps<"tbody"> & VariantProps<typeof tableBodyVariants>;

export function TableBody({ className, align, ...props }: TableBodyProps) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(tableBodyVariants({ align }), className)}
      {...props}
    />
  );
}
