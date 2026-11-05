import { Box } from "@/components/atoms/Box";
import { Text } from "@/components/atoms/Text";
import type { RegisterSummaryProps } from "./RegisterSummary.types";

export function RegisterSummary({ count, revenue, paid, unpaid, insurance }: RegisterSummaryProps) {
  return (
    <Box className="my-4 flex flex-wrap gap-2.5">
      <Chip label="Sales" value={String(count)} />
      <Chip label="Revenue" value={revenue} />
      <Chip label="Paid" value={paid} />
      <Chip label="Unpaid / pending" value={unpaid} />
      <Chip label="Insurance / TPA" value={insurance} />
    </Box>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2 text-[12.5px] text-muted">
      {label}
      <Text as="span" className="mt-px block font-display text-[15px] font-bold text-dark">
        {value}
      </Text>
    </Box>
  );
}
