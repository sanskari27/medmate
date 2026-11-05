import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/utils/className";

const selectableTileVariants = cva("h-auto whitespace-normal shadow-none", {
  variants: {
    kind: {
      pay: "flex-col items-center gap-[3px] rounded-[9px] border-line-2 bg-paper px-1 py-[9px] text-[11.5px] font-bold text-ink-2",
      source:
        "flex-col items-stretch rounded-lg border-line bg-paper p-4 text-left font-normal shadow-card hover:border-light",
    },
    selected: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      kind: "pay",
      selected: true,
      class: "border-mid bg-wash text-mid shadow-[inset_0_0_0_2px_rgba(47,125,82,0.15)]",
    },
    {
      kind: "source",
      selected: true,
      class: "border-mid shadow-[0_0_0_3px_rgba(47,125,82,0.14)] hover:border-mid",
    },
  ],
  defaultVariants: {
    kind: "pay",
    selected: false,
  },
});

export type SelectableTileProps = ComponentProps<typeof Button> &
  VariantProps<typeof selectableTileVariants>;

export function SelectableTile({
  className,
  kind,
  selected,
  type = "button",
  ...props
}: SelectableTileProps) {
  return (
    <Button
      data-slot="selectable-tile"
      type={type}
      variant="ghost"
      aria-pressed={Boolean(selected)}
      className={cn(selectableTileVariants({ kind, selected }), className)}
      {...props}
    />
  );
}

export { selectableTileVariants };
