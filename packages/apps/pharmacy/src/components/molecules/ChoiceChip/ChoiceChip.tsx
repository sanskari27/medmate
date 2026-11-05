import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/utils/className";

const choiceChipVariants = cva(
  "inline-flex h-auto items-center gap-[5px] rounded-full border-[1.5px] px-2.5 py-1.5 text-[12.5px] font-bold shadow-none",
  {
    variants: {
      selected: {
        true: "border-mid bg-wash-2 text-dark hover:bg-wash-2",
        false: "border-line-2 bg-paper text-ink-2 hover:border-light",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export type ChoiceChipProps = ComponentProps<typeof Button> &
  VariantProps<typeof choiceChipVariants>;

export function ChoiceChip({ className, selected, type = "button", ...props }: ChoiceChipProps) {
  return (
    <Button
      data-slot="choice-chip"
      type={type}
      variant="ghost"
      aria-pressed={Boolean(selected)}
      className={cn(choiceChipVariants({ selected }), className)}
      {...props}
    />
  );
}

export { choiceChipVariants };
