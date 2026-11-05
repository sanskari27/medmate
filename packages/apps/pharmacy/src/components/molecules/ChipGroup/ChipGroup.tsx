import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Stack } from "@/components/atoms/Stack";
import { cn } from "@/utils/className";

const chipGroupVariants = cva("gap-1.5");

export type ChipGroupProps = ComponentProps<typeof Stack>;

export function ChipGroup({ className, ...props }: ChipGroupProps) {
  return (
    <Stack
      data-slot="chip-group"
      direction="row"
      align="center"
      wrap
      role="group"
      className={cn(chipGroupVariants(), className)}
      {...props}
    />
  );
}

export { chipGroupVariants };
