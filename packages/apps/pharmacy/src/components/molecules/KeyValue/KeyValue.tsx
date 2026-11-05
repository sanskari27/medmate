import type { ComponentProps } from "react";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

export type KeyValueProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  label: string;
  value: string;
};

export function KeyValue({ className, label, value, ...props }: KeyValueProps) {
  return (
    <Stack data-slot="key-value" gap={0} className={cn(className)} {...props}>
      <Text variant="caption">{label}</Text>
      <Text as="span" className="font-bold">
        {value}
      </Text>
    </Stack>
  );
}
