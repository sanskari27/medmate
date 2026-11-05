import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const tableVariants = cva("w-full border-collapse text-left text-[13px]", {
  variants: {
    align: {
      left: "text-left",
      right: "text-right tabular-nums",
    },
  },
});

export type TableProps = ComponentProps<"table"> & VariantProps<typeof tableVariants>;

export function Table({ className, align, ...props }: TableProps) {
  return <table data-slot="table" className={cn(tableVariants({ align }), className)} {...props} />;
}
