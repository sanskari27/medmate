import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/utils/className";

const chipVariants = cva(
  "inline-flex h-auto items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-bold shadow-none transition",
  {
    variants: {
      selected: {
        true: "border-mid bg-wash text-mid hover:bg-wash",
        false: "border-line-2 bg-paper text-ink-2 hover:bg-wash-2",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export type ChipProps = ComponentProps<typeof Button> & VariantProps<typeof chipVariants>;

export function Chip({ className, selected, type = "button", ...props }: ChipProps) {
  return (
    <Button
      data-slot="chip"
      type={type}
      variant="ghost"
      aria-pressed={Boolean(selected)}
      className={cn(chipVariants({ selected }), className)}
      {...props}
    />
  );
}

export { chipVariants };
