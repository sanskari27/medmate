import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const textVariants = cva("m-0", {
  variants: {
    variant: {
      body: "text-[14px] leading-normal text-ink",
      caption: "text-[11.5px] leading-snug text-muted",
      label: "text-[11.5px] font-bold tracking-wide text-ink-2",
      muted: "text-[13px] text-muted",
    },
    as: {
      p: "",
      span: "",
    },
  },
  defaultVariants: {
    variant: "body",
    as: "p",
  },
});

export type TextProps = ComponentProps<"p"> &
  VariantProps<typeof textVariants> & {
    asChild?: boolean;
  };

export function Text({ className, variant, as = "p", asChild = false, ...props }: TextProps) {
  const Comp = asChild ? Slot : as === "span" ? "span" : "p";
  return <Comp data-slot="text" className={cn(textVariants({ variant, as }), className)} {...props} />;
}

export { textVariants };
