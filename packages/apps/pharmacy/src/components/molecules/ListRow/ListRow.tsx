import type { ComponentProps, ReactNode } from "react";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

export type ListRowProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function ListRow({ className, title, subtitle, leading, trailing, ...props }: ListRowProps) {
  return (
    <Stack
      data-slot="list-row"
      direction="row"
      align="center"
      gap={3}
      className={cn("border-b border-line py-2 last:border-0", className)}
      {...props}
    >
      {leading}
      <Stack gap={0} className="min-w-0 flex-1">
        <Text as="span" className="font-semibold">
          {title}
        </Text>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </Stack>
      {trailing}
    </Stack>
  );
}
