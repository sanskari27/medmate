import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Box } from "@/components/atoms/Box";
import { cn } from "@/utils/className";

const bannerVariants = cva("border-b px-4 py-2 text-[13px] font-bold", {
  variants: {
    tone: {
      amber: "border-amber/40 bg-amber-bg text-gold-d",
      rose: "border-rose/30 bg-rose-bg text-rose",
      green: "border-mint bg-wash text-mid",
    },
  },
  defaultVariants: {
    tone: "amber",
  },
});

export type BannerProps = ComponentProps<typeof Box> & VariantProps<typeof bannerVariants>;

export function Banner({ className, tone, ...props }: BannerProps) {
  return <Box data-slot="banner" className={cn(bannerVariants({ tone }), className)} {...props} />;
}

export { bannerVariants };
