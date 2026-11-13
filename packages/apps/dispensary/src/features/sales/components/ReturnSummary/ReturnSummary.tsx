import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { inr2, saleDate, type SaleDocument } from "../../model";

export function ReturnSummary({ sale, onClose }: { sale: SaleDocument; onClose: () => void }) {
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Return summary"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
    >
      <Box className="w-full max-w-lg rounded-lg bg-paper shadow-pop">
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="border-b border-line px-5 py-4"
        >
          <Box>
            <Heading level={3}>{sale.id}</Heading>
            <Text variant="caption">
              {sale.patientName} · {sale.invoiceNumber} · {saleDate(sale.recordedAt)}
            </Text>
          </Box>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </Stack>
        <Box className="px-5 py-3">
          {sale.lines.map((line) => (
            <Stack
              key={line.position}
              direction="row"
              justify="between"
              className="min-w-0 gap-3 py-1.5"
            >
              <Text className="min-w-0 break-words">
                {line.name} · {line.batchNo} · {line.qty}
              </Text>
              <Text className="shrink-0 font-bold whitespace-nowrap tabular-nums">
                {inr2(line.amount)}
              </Text>
            </Stack>
          ))}
          <Stack
            direction="row"
            justify="between"
            className="mt-2 min-w-0 gap-3 border-t border-line pt-2"
          >
            <Text className="font-bold">Amount</Text>
            <Text className="shrink-0 font-bold whitespace-nowrap tabular-nums">
              {inr2(sale.amount)}
            </Text>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
