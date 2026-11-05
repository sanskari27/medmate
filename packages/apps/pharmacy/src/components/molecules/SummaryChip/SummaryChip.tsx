import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

const summaryChipVariants = cva("rounded-[10px] border border-line bg-paper px-3.5 py-2");

export type SummaryChipProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  label: string;
  value: string;
};

export function SummaryChip({ className, label, value, ...props }: SummaryChipProps) {
  return (
    <Stack data-slot="summary-chip" gap={0} className={cn(summaryChipVariants(), className)} {...props}>
      <Text as="span" variant="caption" className="text-[12.5px]">
        {label}
      </Text>
      <Text as="span" className="mt-px block font-display text-[15px] font-bold text-dark">
        {value}
      </Text>
    </Stack>
  );
}

export { summaryChipVariants };
