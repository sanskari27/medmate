import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/utils/className";

const chipVariants = cva(
  "inline-flex h-auto items-center gap-[7px] rounded-full border px-3.5 py-[7px] text-[12.5px] font-bold shadow-none transition active:translate-y-0 max-[767px]:min-h-10",
  {
    variants: {
      selected: {
        true: "border-dark bg-dark text-white hover:border-dark hover:bg-dark hover:text-white",
        false: "border-line-2 bg-paper text-ink-2 hover:border-[#b9d0c2] hover:bg-wash-2",
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
