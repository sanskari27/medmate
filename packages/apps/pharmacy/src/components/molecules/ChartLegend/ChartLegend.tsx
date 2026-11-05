import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

const legendSwatchVariants = cva("h-[11px] w-[11px] rounded-[3px]", {
  variants: {
    tone: {
      on: "bg-gradient-to-b from-light to-mid",
      off: "bg-gold",
      mid: "bg-mid",
      gold: "bg-gold",
      rose: "bg-rose",
      blue: "bg-blue",
      amber: "bg-amber",
      teal: "bg-teal",
    },
  },
  defaultVariants: {
    tone: "mid",
  },
});

export type ChartLegendTone = NonNullable<VariantProps<typeof legendSwatchVariants>["tone"]>;

export type ChartLegendItem = {
  label: string;
  tone?: ChartLegendTone;
};

export type ChartLegendProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  items: ChartLegendItem[];
};

function LegendItem({ item }: { item: ChartLegendItem }) {
  return (
    <Stack direction="row" align="center" gap={2}>
      <Box className={legendSwatchVariants({ tone: item.tone })} />
      <Text as="span" className="text-[12px] font-semibold text-muted">
        {item.label}
      </Text>
    </Stack>
  );
}

export function ChartLegend({ className, items, ...props }: ChartLegendProps) {
  const rows: ReactNode[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item) continue;
    rows.push(<LegendItem key={`${item.label}-${index}`} item={item} />);
  }
  return (
    <Stack
      data-slot="chart-legend"
      direction="row"
      align="center"
      gap={4}
      className={cn(className)}
      {...props}
    >
      {rows}
    </Stack>
  );
}

export { legendSwatchVariants };
