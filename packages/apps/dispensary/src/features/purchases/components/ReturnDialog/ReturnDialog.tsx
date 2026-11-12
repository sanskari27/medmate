import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import { inr2, type PurchaseDocument, type PurchaseLine } from "../../model";

const headCell =
  "sticky top-0 z-20 border-b border-line bg-wash-2 px-2 py-2 text-left text-[10.5px] font-bold tracking-[0.04em] whitespace-nowrap text-muted uppercase";
const bodyCell = "border-b border-line px-2 py-1.5 align-middle text-[12.5px] text-ink-2";
const footCell =
  "border-t-2 border-line-2 bg-wash-2 px-2 py-2 text-[12.5px] font-extrabold text-ink-2";

const columns: { label: string; align: "left" | "right" }[] = [
  { label: "Medicine", align: "left" },
  { label: "Batch", align: "left" },
  { label: "Expiry", align: "left" },
  { label: "Purchased", align: "right" },
  { label: "Free", align: "right" },
  { label: "Returned", align: "right" },
  { label: "On hand", align: "right" },
  { label: "Rate", align: "right" },
  { label: "MRP", align: "right" },
  { label: "GST", align: "right" },
  { label: "Return qty", align: "right" },
  { label: "Return free", align: "right" },
  { label: "Amount", align: "right" },
];

export function ReturnDialog({
  document,
  saving,
  error,
  onClose,
  onReturn,
}: {
  document: PurchaseDocument;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onReturn: (lines: { position: number; qty: number; freeQty: number }[]) => void;
}) {
  const starting = prefill(document.lines);
  const [qty, setQty] = useState<Record<number, string>>(starting.qty);
  const [free, setFree] = useState<Record<number, string>>(starting.free);
  const draft = review(document.lines, qty, free);

  return (
    <Box
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-4 backdrop-blur-[3px] md:p-6"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Create return"
        className="flex h-[min(880px,calc(100vh-2rem))] w-full max-w-[1280px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          gap={3}
          className="border-b border-line px-5 py-4"
        >
          <Box className="min-w-0">
            <Heading level={3}>Create return</Heading>
            <Text variant="caption">
              {document.id} · {document.distributorName}
            </Text>
          </Box>
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            Close
          </Button>
        </Stack>
        <Box className="shrink-0 border-b border-line px-5 py-3">
          <Box className="grid gap-3 md:grid-cols-3">
            <Field label="Distributor / supplier">
              <Input
                aria-label="Distributor"
                readOnly
                value={document.distributorName}
                className="bg-wash-2"
              />
            </Field>
            <Field label="Invoice number">
              <Input
                aria-label="Invoice number"
                readOnly
                value={document.invoiceNo}
                className="bg-wash-2"
              />
            </Field>
            <Field label="Invoice date">
              <Input
                aria-label="Invoice date"
                type="date"
                readOnly
                value={document.invoiceDate}
                className="bg-wash-2"
              />
            </Field>
          </Box>
        </Box>
        <Box className="flex min-h-0 flex-1 flex-col">
          <Stack
            direction="row"
            align="center"
            justify="between"
            gap={2}
            className="shrink-0 px-5 pt-3 pb-2"
          >
            <Heading level={4} className="text-[14px]">
              Items on this bill
            </Heading>
            <Text variant="caption">
              Return qty and free start from what is still on this bill and in stock
            </Text>
          </Stack>
          <Box className="min-h-0 flex-1 overflow-auto px-5 pb-3">
            <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
              <Box className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-[12.5px] [&_tbody_tr:last-child_td]:border-b-0">
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column.label}
                          className={cn(headCell, column.align === "right" && "text-right")}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {document.lines.map((line) => {
                      const row = draft.rows[line.position];
                      const billed = row?.qty ?? 0;
                      return (
                        <tr key={line.position} className="hover:bg-wash-2">
                          <td className={cn(bodyCell, "font-bold whitespace-nowrap text-ink")}>
                            {line.name}
                          </td>
                          <td className={cn(bodyCell, "font-mono whitespace-nowrap")}>
                            {line.batchNo}
                          </td>
                          <td className={cn(bodyCell, "whitespace-nowrap")}>{line.expiry}</td>
                          <td className={cn(bodyCell, "text-right tabular-nums")}>{line.qty}</td>
                          <td className={cn(bodyCell, "text-right tabular-nums")}>
                            {line.freeQty}
                          </td>
                          <td className={cn(bodyCell, "text-right whitespace-nowrap tabular-nums")}>
                            {returnedLabel(line)}
                          </td>
                          <td className={cn(bodyCell, "text-right tabular-nums")}>{line.onHand}</td>
                          <td className={cn(bodyCell, "text-right whitespace-nowrap tabular-nums")}>
                            {inr2(line.rate)}
                          </td>
                          <td className={cn(bodyCell, "text-right whitespace-nowrap tabular-nums")}>
                            {inr2(line.mrp)}
                          </td>
                          <td className={cn(bodyCell, "text-right tabular-nums")}>{line.gst}%</td>
                          <td className={cn(bodyCell, "w-[96px]")}>
                            <Input
                              aria-label={`Return billed ${line.name}`}
                              aria-invalid={row ? !row.ok : undefined}
                              controlSize="sm"
                              inputMode="numeric"
                              className="text-right"
                              disabled={line.qty - line.returnedQty <= 0 || line.onHand <= 0}
                              value={qty[line.position] ?? ""}
                              onChange={(event) =>
                                setQty({ ...qty, [line.position]: event.target.value })
                              }
                            />
                          </td>
                          <td className={cn(bodyCell, "w-[96px]")}>
                            <Input
                              aria-label={`Return free ${line.name}`}
                              aria-invalid={row ? !row.ok : undefined}
                              controlSize="sm"
                              inputMode="numeric"
                              className="text-right"
                              disabled={line.freeQty - line.returnedFree <= 0 || line.onHand <= 0}
                              value={free[line.position] ?? ""}
                              onChange={(event) =>
                                setFree({ ...free, [line.position]: event.target.value })
                              }
                            />
                          </td>
                          <td
                            className={cn(
                              bodyCell,
                              "text-right font-bold whitespace-nowrap tabular-nums",
                            )}
                          >
                            {inr2(lineAmount(line, billed))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={10} className={footCell}>
                        Return total
                      </td>
                      <td className={cn(footCell, "text-right tabular-nums")}>{draft.billed}</td>
                      <td className={cn(footCell, "text-right tabular-nums")}>{draft.free}</td>
                      <td className={cn(footCell, "text-right tabular-nums")}>
                        {inr2(draft.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </Box>
            </Box>
          </Box>
        </Box>
        {error ? (
          <Text className="shrink-0 px-5 text-[12.5px] font-bold text-rose">{error}</Text>
        ) : null}
        {!draft.valid && draft.touched ? (
          <Text className="shrink-0 px-5 text-[12.5px] font-bold text-rose">
            Return is more than the quantity received or the stock on hand.
          </Text>
        ) : null}
        <Stack
          direction="row"
          align="center"
          justify="end"
          gap={3}
          wrap
          className="shrink-0 border-t border-line px-5 py-3"
        >
          <Text as="span" className="text-[13px] text-muted">
            {draft.billed + draft.free} units
          </Text>
          <Text as="span" className="text-[18px] font-bold text-dark">
            Return {inr2(draft.amount)}
          </Text>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!draft.anyUnit || !draft.valid || saving}
            onClick={() =>
              onReturn(
                draft.lines
                  .filter((line) => line.qty + line.freeQty > 0)
                  .map((line) => ({
                    position: line.position,
                    qty: line.qty,
                    freeQty: line.freeQty,
                  })),
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

function returnedLabel(line: PurchaseLine): string {
  if (line.returnedFree > 0) return `${line.returnedQty} + ${line.returnedFree} free`;
  return String(line.returnedQty);
}

function lineAmount(line: PurchaseLine, billed: number): number {
  const rate = Number(line.rate);
  if (!Number.isFinite(rate) || billed <= 0) return 0;
  return rate * billed * (1 + line.gst / 100);
}

function whole(value: string): number | null {
  const text = value.trim();
  if (text === "") return 0;
  if (!/^\d+$/.test(text)) return null;
  return Number(text);
}

function prefill(lines: PurchaseLine[]): {
  qty: Record<number, string>;
  free: Record<number, string>;
} {
  const handLeft = new Map<string, number>();
  const qty: Record<number, string> = {};
  const free: Record<number, string> = {};
  for (const line of lines) {
    const key = `${line.productId}\n${line.batchNo}`;
    if (!handLeft.has(key)) handLeft.set(key, Math.max(0, line.onHand));
    let hand = handLeft.get(key) ?? 0;
    const billed = Math.min(Math.max(0, line.qty - line.returnedQty), hand);
    hand -= billed;
    const freeUnits = Math.min(Math.max(0, line.freeQty - line.returnedFree), hand);
    hand -= freeUnits;
    handLeft.set(key, hand);
    qty[line.position] = String(billed);
    free[line.position] = String(freeUnits);
  }
  return { qty, free };
}

function review(
  lines: PurchaseLine[],
  qty: Record<number, string>,
  free: Record<number, string>,
): {
  rows: Record<number, { qty: number; ok: boolean }>;
  lines: { position: number; qty: number; freeQty: number }[];
  billed: number;
  free: number;
  amount: number;
  valid: boolean;
  anyUnit: boolean;
  touched: boolean;
} {
  const handUsed = new Map<string, number>();
  const rows: Record<number, { qty: number; ok: boolean }> = {};
  const parsed: { position: number; qty: number; freeQty: number }[] = [];
  let billed = 0;
  let freeUnits = 0;
  let amount = 0;
  let valid = true;
  let anyUnit = false;
  let touched = false;
  for (const line of lines) {
    const qtyText = qty[line.position] ?? "";
    const freeText = free[line.position] ?? "";
    if (qtyText.trim() !== "" || freeText.trim() !== "") touched = true;
    const billedQty = whole(qtyText);
    const freeQty = whole(freeText);
    const key = `${line.productId}\n${line.batchNo}`;
    const used = handUsed.get(key) ?? 0;
    const numeric = billedQty != null && freeQty != null;
    const units = numeric ? billedQty + freeQty : 0;
    const ok =
      numeric &&
      billedQty <= line.qty - line.returnedQty &&
      freeQty <= line.freeQty - line.returnedFree &&
      used + units <= line.onHand;
    if (numeric) handUsed.set(key, used + units);
    const counted = ok ? billedQty : 0;
    rows[line.position] = { qty: counted, ok };
    parsed.push({
      position: line.position,
      qty: numeric ? billedQty : 0,
      freeQty: numeric ? freeQty : 0,
    });
    if (!ok) valid = false;
    if (ok && units > 0) anyUnit = true;
    if (ok) {
      billed += billedQty;
      freeUnits += freeQty;
      amount += lineAmount(line, billedQty);
    }
  }
  return {
    rows,
    lines: parsed,
    billed,
    free: freeUnits,
    amount,
    valid,
    anyUnit,
    touched,
  };
}
