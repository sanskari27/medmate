import type { ComponentProps } from "react";
import { Heading } from "@/components/atoms/Heading";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

export type EmptyStateProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  title: string;
  body?: string;
};

export function EmptyState({ className, title, body, ...props }: EmptyStateProps) {
  return (
    <Stack data-slot="empty-state" align="center" gap={2} className={cn("px-6 py-10 text-center", className)} {...props}>
      <Heading level={3}>{title}</Heading>
      {body ? <Text variant="muted">{body}</Text> : null}
    </Stack>
  );
}
