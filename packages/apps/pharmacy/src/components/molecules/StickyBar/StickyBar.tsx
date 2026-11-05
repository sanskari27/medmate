import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Stack } from "@/components/atoms/Stack";
import { cn } from "@/utils/className";

const stickyBarVariants = cva(
  "sticky top-[-22px] z-[5] -mt-[22px] mb-4 border-b border-line bg-paper/95 py-2.5 shadow-[0_4px_16px_rgba(27,61,41,0.06)] backdrop-blur",
);

export type StickyBarProps = ComponentProps<typeof Stack>;

export function StickyBar({ className, ...props }: StickyBarProps) {
  return (
    <Stack
      data-slot="sticky-bar"
      direction="row"
      align="center"
      wrap
      gap={3}
      className={cn(stickyBarVariants(), className)}
      {...props}
    />
  );
}

export { stickyBarVariants };
