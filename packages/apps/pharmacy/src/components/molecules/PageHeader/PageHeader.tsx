import type { ComponentProps, ReactNode } from "react";
import { Heading } from "@/components/atoms/Heading";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

export type PageHeaderProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function PageHeader({ className, title, subtitle, children, ...props }: PageHeaderProps) {
  return (
    <Stack
      data-slot="page-header"
      direction="row"
      align="center"
      justify="between"
      gap={3}
      className={cn("mb-4", className)}
      {...props}
    >
      <Stack gap={1}>
        <Heading level={1}>{title}</Heading>
        {subtitle ? <Text variant="muted">{subtitle}</Text> : null}
      </Stack>
      {children}
    </Stack>
  );
}
