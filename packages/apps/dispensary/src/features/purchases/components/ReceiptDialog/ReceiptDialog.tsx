import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { canReturn, formatWhen, inr2, type PurchaseDocument, typeLabel } from "../../model";

export function ReceiptDialog({
  document,
  canCreateReturn,
  saving,
  error,
  onClose,
  onReturn,
}: {
  document: PurchaseDocument;
  canCreateReturn: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onReturn: (lines: { position: number; qty: number; freeQty: number }[]) => void;
}) {
  const [returning, setReturning] = useState(false);
  const [qty, setQty] = useState<Record<number, string>>({});
  const [free, setFree] = useState<Record<number, string>>({});
  const showReturn = document.type === "purchase" && canCreateReturn && canReturn(document);

  function withinCap(line: PurchaseDocument["lines"][number]): boolean {
    const billed = Number(qty[line.position] || "0");
    const freeQty = Number(free[line.position] || "0");
    if (!Number.isInteger(billed) || !Number.isInteger(freeQty) || billed < 0 || freeQty < 0)
      return false;
    return (
      billed <= line.qty - line.returnedQty &&
      freeQty <= line.freeQty - line.returnedFree &&
      billed + freeQty <= line.onHand
    );
  }

  const lines = document.lines.map((line) => ({
    position: line.position,
    qty: Number(qty[line.position] || "0"),
    freeQty: Number(free[line.position] || "0"),
  }));
  const anyUnit = lines.some((line) => line.qty + line.freeQty > 0);
  const allValid = document.lines.every(withinCap);

  return (
    <Box className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <Box
        role="dialog"
        aria-label={`${document.id} receipt`}
        className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-md border border-line bg-paper p-5 shadow-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <Stack direction="row" align="center" className="mb-3 justify-between">
          <Heading level={3}>
            {document.id} · {document.distributorName}
          </Heading>
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            Close
          </Button>
        </Stack>
        <Text className="mb-3 text-[12.5px] text-muted">
          {typeLabel(document.type)} · Invoice {document.invoiceNo} · {document.invoiceDate} ·
          Entered {formatWhen(document.recordedAt)}
        </Text>
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              {["Item", "Batch", "Exp", "Qty", "Free", "Rate", "MRP", "GST", "Amount"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="bg-wash-2 px-2 py-2 text-left text-[10.5px] font-bold text-muted uppercase"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {document.lines.map((line) => (
              <tr key={line.position}>
                <td className="border-t border-line px-2 py-2 font-bold">{line.name}</td>
                <td className="border-t border-line px-2 py-2">{line.batchNo}</td>
                <td className="border-t border-line px-2 py-2">{line.expiry}</td>
                <td className="border-t border-line px-2 py-2">{line.qty}</td>
                <td className="border-t border-line px-2 py-2">{line.freeQty || "—"}</td>
                <td className="border-t border-line px-2 py-2">{inr2(line.rate)}</td>
                <td className="border-t border-line px-2 py-2">{inr2(line.mrp)}</td>
                <td className="border-t border-line px-2 py-2">{line.gst}%</td>
                <td className="border-t border-line px-2 py-2 font-bold">{inr2(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Text className="mt-3 font-bold">
          Bill total ({document.units} units stocked) {inr2(document.total)}
        </Text>
        {showReturn && !returning ? (
          <Button type="button" className="mt-4" onClick={() => setReturning(true)}>
            Create return
          </Button>
        ) : null}
        {returning ? (
          <Box className="mt-4">
            {document.lines.map((line) => (
              <Stack key={line.position} direction="row" className="mb-2 items-center gap-2">
                <Text className="min-w-40">{line.name}</Text>
                <Input
                  aria-label={`Return billed ${line.name}`}
                  value={qty[line.position] ?? ""}
                  onChange={(event) => setQty({ ...qty, [line.position]: event.target.value })}
                />
                <Input
                  aria-label={`Return free ${line.name}`}
                  value={free[line.position] ?? ""}
                  onChange={(event) => setFree({ ...free, [line.position]: event.target.value })}
                />
              </Stack>
            ))}
            <Button
              type="button"
              disabled={!anyUnit || !allValid || saving}
              onClick={() => onReturn(lines.filter((line) => line.qty + line.freeQty > 0))}
            >
              Save return
            </Button>
          </Box>
        ) : null}
        {error ? <Text className="mt-3 text-[12.5px] font-bold text-rose">{error}</Text> : null}
      </Box>
    </Box>
  );
}
