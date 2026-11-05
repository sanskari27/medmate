import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const headingVariants = cva("m-0 font-display font-extrabold [line-height:1.18] tracking-[-0.02em] text-dark", {
  variants: {
    level: {
      1: "text-[2em]",
      2: "text-[1.5em]",
      3: "text-[1.17em]",
      4: "text-[1em]",
    },
  },
  defaultVariants: {
    level: 2,
  },
});

export type HeadingProps = ComponentProps<"h2"> &
  VariantProps<typeof headingVariants> & {
    asChild?: boolean;
  };

function headingTag(level: HeadingProps["level"]) {
  if (level === 1) return "h1" as const;
  if (level === 3) return "h3" as const;
  if (level === 4) return "h4" as const;
  return "h2" as const;
}

export function Heading({ className, level = 2, asChild = false, ...props }: HeadingProps) {
  const Comp = asChild ? Slot : headingTag(level);
  return <Comp data-slot="heading" className={cn(headingVariants({ level }), className)} {...props} />;
}

export { headingVariants };
