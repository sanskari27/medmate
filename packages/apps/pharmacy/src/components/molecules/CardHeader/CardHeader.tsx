import type { ComponentProps, ReactNode } from "react";
import { Heading } from "@/components/atoms/Heading";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

export type CardHeaderProps = ComponentProps<typeof Stack> & {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function CardHeader({
  className,
  title,
  subtitle,
  actions,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <Stack
      data-slot="card-header"
      direction="row"
      align="center"
      justify="between"
      gap={3}
      className={cn("px-4 py-3", className)}
      {...props}
    >
      <Stack gap={1}>
        <Heading level={3}>{title}</Heading>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </Stack>
      {actions ?? children}
    </Stack>
  );
}
