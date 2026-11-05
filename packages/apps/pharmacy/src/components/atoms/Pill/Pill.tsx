import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const pillVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap",
  {
    variants: {
      tone: {
        green: "bg-wash text-mid",
        gold: "bg-amber-bg text-gold-d",
        blue: "bg-blue-bg text-blue",
        rose: "bg-rose-bg text-rose",
        gray: "bg-gray-pill text-muted",
        teal: "bg-teal-bg text-teal",
      },
    },
    defaultVariants: {
      tone: "green",
    },
  },
);

export type PillProps = ComponentProps<"span"> &
  VariantProps<typeof pillVariants> & {
    dot?: boolean;
  };

export type PillTone = NonNullable<PillProps["tone"]>;

export function Pill({ className, tone, dot = false, children, ...props }: PillProps) {
  return (
    <span data-slot="pill" className={cn(pillVariants({ tone }), className)} {...props}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

export { pillVariants };
