import type { ComponentProps } from "react";
import { Stack } from "@/components/atoms/Stack";
import { cn } from "@/utils/className";

export type ToolbarProps = ComponentProps<typeof Stack>;

export function Toolbar({ className, ...props }: ToolbarProps) {
  return (
    <Stack
      data-slot="toolbar"
      direction="row"
      align="center"
      wrap
      gap={2}
      className={cn("mb-3", className)}
      {...props}
    />
  );
}
