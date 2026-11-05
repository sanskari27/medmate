import type { ComponentProps } from "react";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

export type KpiStatProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  label: string;
  value: string;
  hint?: string;
};

export function KpiStat({ className, label, value, hint, ...props }: KpiStatProps) {
  return (
    <Stack
      data-slot="kpi-stat"
      gap={1}
      className={cn("rounded-lg border border-line bg-paper px-4 py-3 shadow-sm", className)}
      {...props}
    >
      <Text variant="label">{label}</Text>
      <Text className="font-display text-[22px] font-extrabold text-dark">{value}</Text>
      {hint ? <Text variant="caption">{hint}</Text> : null}
    </Stack>
  );
}
