import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { clampPercent, cn } from "@/utils/className";

const progressVariants = cva("h-full rounded-full", {
  variants: {
    tone: {
      mid: "bg-mid",
      amber: "bg-amber",
      rose: "bg-rose",
      blue: "bg-blue",
      gold: "bg-gold",
      teal: "bg-teal",
    },
  },
  defaultVariants: {
    tone: "mid",
  },
});

export type ProgressProps = Omit<ComponentProps<"div">, "children"> &
  VariantProps<typeof progressVariants> & {
    value: number;
    label?: string;
  };

export type ProgressTone = NonNullable<ProgressProps["tone"]>;

export function Progress({ className, value, tone, label, ...props }: ProgressProps) {
  const width = clampPercent(value) + "%";
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-label={typeof label === "string" ? label : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampPercent(value)}
      className={cn("h-2 overflow-hidden rounded-full bg-wash", className)}
      {...props}
    >
      <div className={progressVariants({ tone })} style={{ width }} />
    </div>
  );
}

export { progressVariants };
