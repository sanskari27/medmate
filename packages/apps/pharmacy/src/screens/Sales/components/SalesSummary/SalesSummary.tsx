import { Box } from "@/components/atoms/Box";
import { Text } from "@/components/atoms/Text";
import type { SalesSummaryProps } from "./SalesSummary.types";

export function SalesSummary({ periodLabel, bills, units, gross, tax, net }: SalesSummaryProps) {
  return (
    <Box className="mb-3.5 flex flex-wrap gap-2.5">
      <Chip label="Showing" value={periodLabel} compact />
      <Chip label="Bills" value={String(bills)} />
      <Chip label="Units" value={String(units)} />
      <Chip label="Gross" value={gross} />
      <Chip label="GST" value={tax} />
      <Chip label="Net collected" value={net} />
    </Box>
  );
}

function Chip({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2 text-[12.5px] text-muted">
      {label}
      <Text as="span" className={`mt-px block font-display font-bold text-dark ${compact ? "text-[13px]" : "text-[15px]"}`}>
        {value}
      </Text>
    </Box>
  );
}
