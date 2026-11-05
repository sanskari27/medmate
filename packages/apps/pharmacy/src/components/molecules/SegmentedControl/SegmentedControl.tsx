import type { ReactNode } from "react";
import { Stack } from "@/components/atoms/Stack";
import { cn } from "@/utils/className";

export type SegmentedControlProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

export function SegmentedControl({ children, className, label }: SegmentedControlProps) {
  return (
    <Stack
      data-slot="segmented-control"
      direction="row"
      gap={1}
      role="group"
      aria-label={label}
      className={cn("w-fit rounded-md bg-wash p-1", className)}
    >
      {children}
    </Stack>
  );
}
