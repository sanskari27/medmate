import type { ComponentProps } from "react";
import { Progress, type ProgressTone } from "@/components/atoms/Progress";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

export type MeterProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  label: string;
  valueLabel: string;
  value: number;
  tone?: ProgressTone;
};

export function Meter({ className, label, valueLabel, value, tone, ...props }: MeterProps) {
  return (
    <Stack data-slot="meter" className={cn("gap-[3px]", className)} {...props}>
      <Stack direction="row" justify="between">
        <Text as="span" className="text-xs font-bold text-ink">
          {label}
        </Text>
        <Text as="span" className="text-xs text-muted">
          {valueLabel}
        </Text>
      </Stack>
      <Progress value={value} tone={tone} label={label} />
    </Stack>
  );
}
