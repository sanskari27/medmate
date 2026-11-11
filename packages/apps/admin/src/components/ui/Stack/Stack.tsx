import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const stackVariants = cva("flex", {
  variants: {
    direction: {
      row: "flex-row",
      column: "flex-col",
    },
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    },
    wrap: {
      true: "flex-wrap",
      false: "",
    },
  },
  defaultVariants: {
    direction: "column",
    gap: 0,
    wrap: false,
  },
});

export type StackProps = ComponentProps<"div"> &
  VariantProps<typeof stackVariants> & {
    asChild?: boolean;
  };

export function Stack({
  className,
  direction,
  gap,
  align,
  justify,
  wrap,
  asChild = false,
  ...props
}: StackProps) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      data-slot="stack"
      className={cn(stackVariants({ direction, gap, align, justify, wrap }), className)}
      {...props}
    />
  );
}

export { stackVariants };
