import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import { inr2, returnDraft, saleDate, type SaleDocument } from "../../model";

const headCell =
  "border-b border-line bg-wash-2 px-2 py-2 text-left text-[10.5px] font-bold tracking-[0.04em] whitespace-nowrap text-muted uppercase";
const bodyCell = "border-b border-line px-2 py-1.5 align-middle text-[12.5px] text-ink-2";

export function ReturnDialog({
  sale,
  saving,
  error,
  onClose,
  onReturn,
}: {
  sale: SaleDocument;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onReturn: (lines: { position: number; qty: number }[]) => void;
}) {
  const [qty, setQty] = useState<Record<number, string>>({});
  const draft = returnDraft(sale.lines, qty, sale.extraAmount ?? "0.00");

  return (
    <Box
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-4"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Create return"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="border-b border-line px-5 py-4"
        >
          <Box>
            <Heading level={3}>Create return</Heading>
            <Text variant="caption">
              {sale.invoiceNumber} · {saleDate(sale.recordedAt)}
            </Text>
          </Box>
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            Close
          </Button>
        </Stack>
        <Box className="min-h-0 flex-1 overflow-auto px-5 py-3">
          <table className="w-full border-separate border-spacing-0 text-[12.5px]">
            <thead>
              <tr>
                {["Medicine", "Batch", "Sold", "Returned", "Return qty", "Amount"].map((label) => (
                  <th
                    key={label}
                    className={cn(
                      headCell,
                      label !== "Medicine" && label !== "Batch" && "text-right",
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sale.lines.map((line) => {
                const row = draft.rows.find((item) => item.position === line.position);
                const remaining = line.qty - (line.returnedQty ?? 0);
                return (
                  <tr key={line.position}>
                    <td className={cn(bodyCell, "font-bold text-ink")}>{line.name}</td>
                    <td className={cn(bodyCell, "font-mono")}>{line.batchNo}</td>
                    <td className={cn(bodyCell, "text-right tabular-nums")}>{line.qty}</td>
                    <td className={cn(bodyCell, "text-right tabular-nums")}>
                      {line.returnedQty ?? 0}
                    </td>
                    <td className={cn(bodyCell, "w-[96px]")}>
                      <Input
                        aria-label={`Return ${line.name}`}
                        aria-invalid={row ? !row.ok : undefined}
                        controlSize="sm"
                        inputMode="numeric"
                        className="text-right"
                        disabled={remaining <= 0}
                        value={qty[line.position] ?? ""}
                        onChange={(event) =>
                          setQty({ ...qty, [line.position]: event.target.value })
                        }
                      />
                    </td>
                    <td className={cn(bodyCell, "text-right whitespace-nowrap tabular-nums")}>
                      {inr2(line.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {error ? (
            <Text className="mt-3 text-[13px] font-bold text-[#b4232a]">{error}</Text>
          ) : null}
        </Box>
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="border-t border-line px-5 py-3"
        >
          <Text className="text-[13px] font-bold">Refund {inr2(draft.amount)}</Text>
          <Button
            type="button"
            disabled={!draft.ready || saving}
            onClick={() =>
              onReturn(
                draft.rows
                  .filter((row) => row.qty > 0)
                  .map((row) => ({ position: row.position, qty: row.qty })),
              )
            }
          >
            Save return
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
