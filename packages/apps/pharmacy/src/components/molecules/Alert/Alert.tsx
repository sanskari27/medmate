import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Box } from "@/components/atoms/Box";
import { cn } from "@/utils/className";

const alertVariants = cva("rounded-sm border px-3 py-2 text-[13px] font-bold", {
  variants: {
    tone: {
      rose: "border-[#f3c0c0] bg-rose-bg text-rose",
      amber: "border-amber/30 bg-amber-bg text-gold-d",
      green: "border-mint bg-wash text-mid",
    },
  },
  defaultVariants: {
    tone: "rose",
  },
});

export type AlertProps = ComponentProps<typeof Box> & VariantProps<typeof alertVariants>;

export function Alert({ className, tone, ...props }: AlertProps) {
  return <Box data-slot="alert" className={cn(alertVariants({ tone }), className)} {...props} />;
}

export { alertVariants };
