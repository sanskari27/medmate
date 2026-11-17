import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-extrabold",
  {
    variants: {
      tone: {
        default: "bg-surface-3 text-ink-2",
        success: "bg-mint-100 text-forest",
        warning: "bg-gold-100 text-gold-ink",
        danger: "bg-red-bg text-red",
        info: "bg-blue-bg text-blue",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}
