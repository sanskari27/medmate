import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const boxVariants = cva("", {
  variants: {
    display: {
      block: "block",
      flex: "flex",
      grid: "grid",
      inline: "inline-block",
    },
  },
});

export type BoxProps = ComponentProps<"div"> &
  VariantProps<typeof boxVariants> & {
    asChild?: boolean;
  };

export function Box({ className, display, asChild = false, ...props }: BoxProps) {
  const Comp = asChild ? Slot : "div";
  return <Comp data-slot="box" className={cn(boxVariants({ display }), className)} {...props} />;
}

export { boxVariants };
