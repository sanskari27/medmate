import type { WardSupplyInvoiceProps } from "./WardSupplyInvoice.types";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import type { MouseEvent } from "react";
import { inr, fmtDateTime } from "@/utils";
import {
  WardSupplyItem,
  WardSupplyReason,
  reasonMeta,
  itemMrp,
} from "@/utils/calculations/hospitalAccount";
import { IconPrint, IconCheck } from "@/components/atoms";
// Ward-supply credit invoice — shown before sending to the hospital, and re-viewable after.
// Lists every medicine with batch no., MRP and the discounted hospital (credit) price, so the
// hospital can see what to bill the patient. Self-contained styles + print (Save as PDF).
export type SupplyInvoiceData = {
  invoiceNo: string;
  at: number;
  wardName: string;
  reason: WardSupplyReason;
  patientId?: string;
  patientName?: string;
  refDoc?: string;
  indentId?: string;
  items: WardSupplyItem[];
};
export default function WardSupplyInvoice({
  data,
  profile,
  account,
  onClose,
  onEdit,
  onConfirm,
}: WardSupplyInvoiceProps) {
  const rows = data.items.map((it) => {
    const mrp = itemMrp(it, account.discountPct);
    const disc = mrp > 0 ? Math.round((1 - it.price / mrp) * 100) : 0;
    return {
      ...it,
      mrp,
      disc,
      mrpAmount: Math.round(mrp * it.qty * 100) / 100,
      amount: Math.round(it.price * it.qty * 100) / 100,
    };
  });
  const mrpTotal = rows.reduce((a, r) => a + r.mrpAmount, 0);
  const creditTotal = rows.reduce((a, r) => a + r.amount, 0);
  const margin = Math.round((mrpTotal - creditTotal) * 100) / 100;
  const draft = onConfirm != null;
  return (
    <Box
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-auto bg-[rgba(15,30,22,.55)] p-6 animate-[pd-fade_0.16s_ease] motion-reduce:animate-none"
      onClick={onClose}
    >
      <style>{PRINT_CSS}</style>
      <Box
        className="w-full max-w-[880px] rounded-[14px] bg-[#eef3f0] shadow-[0_24px_60px_rgba(0,0,0,.3)] animate-[pd-pop_0.2s_cubic-bezier(0.2,0.9,0.3,1.2)] motion-reduce:animate-none"
        onClick={stopPropagationOnClick}
      >
        <Box className="sticky top-0 z-[2] flex flex-wrap items-center gap-2 rounded-t-[14px] border-b border-[#d8e4dd] bg-[#eef3f0] px-4 py-[13px]">
          <Text as="span" className="!font-display !text-[13.5px] !font-bold !text-dark">
            {draft
              ? "Invoice preview — review before sending to hospital"
              : `Invoice ${data.invoiceNo}`}
          </Text>
          <Text className={cn("!flex-1")} as="span" />
          <Button
            variant="ghost"
            className="!rounded-[9px] !border-[#cfe0d6] !px-[13px] !py-2 !text-[13px] !text-dark"
            onClick={printOnClick}
          >
            <IconPrint size={14} /> Print / Save PDF
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              className="!rounded-[9px] !border-[#cfe0d6] !px-[13px] !py-2 !text-[13px] !text-dark"
              onClick={onEdit}
            >
              ← Edit
            </Button>
          )}
          {onConfirm ? (
            <Button
              variant="primary"
              className="!rounded-[9px] !px-[13px] !py-2 !text-[13px]"
              onClick={onConfirm}
            >
              <IconCheck size={14} /> Confirm &amp; send to hospital
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="!rounded-[9px] !border-[#cfe0d6] !px-[13px] !py-2 !text-[13px] !text-dark"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </Box>

        <Box className="wsi-print-area bg-transparent p-[22px] print:bg-white print:p-[12mm]">
          <Box className="rounded-sm border border-[#e1ece5] bg-white px-7 py-[26px] text-[12.5px] text-ink print:border-0 print:p-0">
            {/* header */}
            <Box className="flex items-start justify-between border-b-2 border-dark pb-3">
              <Box>
                <Box className="font-display text-[22px] font-extrabold tracking-[0.02em] text-dark">
                  TAX INVOICE
                </Box>
                <Box className="mt-px text-[11.5px] text-muted">
                  Ward supply · billed to hospital on credit
                </Box>
              </Box>
              <Box className="flex flex-col gap-0.5 text-right text-[11.5px]">
                <Box>
                  <Text as="span" className="mr-1.5 text-faint">
                    Invoice no.
                  </Text>
                  <Text as="span" className="font-bold font-mono text-ink">
                    {data.invoiceNo}
                  </Text>
                </Box>
                <Box>
                  <Text as="span" className="mr-1.5 text-faint">
                    Date
                  </Text>
                  <Text as="span" className="font-bold font-mono text-ink">
                    {fmtDateTime(data.at)}
                  </Text>
                </Box>
                <Box>
                  <Text as="span" className="mr-1.5 text-faint">
                    Terms
                  </Text>
                  <Text as="span" className="font-bold font-mono text-ink">
                    {account.creditTerms}
                  </Text>
                </Box>
              </Box>
            </Box>

            {/* parties */}
            <Box className="my-4 grid grid-cols-2 gap-[18px]">
              <Box>
                <Text
                  className="!text-[9.5px] !font-extrabold !uppercase !tracking-[0.08em] !text-faint"
                  as="span"
                >
                  Supplied by
                </Text>
                <Text as="span" className="font-bold my-[3px] block font-display text-sm text-dark">
                  {profile.name}
                </Text>
                <Text className="my-px text-[11.5px] leading-snug text-ink-2">
                  {profile.address}
                </Text>
                <Text className="my-px text-[11.5px] leading-snug text-ink-2">
                  GSTIN: {profile.gstin || "—"} · DL: {profile.dlNo || "—"}
                </Text>
              </Box>
              <Box>
                <Text
                  className="!text-[9.5px] !font-extrabold !uppercase !tracking-[0.08em] !text-faint"
                  as="span"
                >
                  Bill to (credit account)
                </Text>
                <Text as="span" className="font-bold my-[3px] block font-display text-sm text-dark">
                  {account.name}
                </Text>
                <Text className="my-px text-[11.5px] leading-snug text-ink-2">
                  {account.contact}
                </Text>
                <Text className="my-px text-[11.5px] leading-snug text-ink-2">
                  GSTIN: {account.gstin || "—"}
                </Text>
              </Box>
            </Box>

            {/* meta */}
            <Box className="mb-3 grid grid-cols-4 gap-2.5 rounded-sm border border-[#e1ece5] bg-[#F0FAF4] px-3 py-2.5">
              <Box>
                <Text
                  as="span"
                  className="block text-[9px] font-extrabold uppercase tracking-[0.06em] text-faint"
                >
                  Ward
                </Text>
                <Text as="span" className="font-bold text-xs text-ink">
                  {data.wardName}
                </Text>
              </Box>
              <Box>
                <Text
                  as="span"
                  className="block text-[9px] font-extrabold uppercase tracking-[0.06em] text-faint"
                >
                  Reason
                </Text>
                <Text as="span" className="font-bold text-xs text-ink">
                  {reasonMeta(data.reason).label}
                </Text>
              </Box>
              <Box>
                <Text
                  as="span"
                  className="block text-[9px] font-extrabold uppercase tracking-[0.06em] text-faint"
                >
                  Indent ref
                </Text>
                <Text as="span" className="font-bold text-xs text-ink">
                  {data.indentId || data.refDoc || "—"}
                </Text>
              </Box>
              <Box>
                <Text
                  as="span"
                  className="block text-[9px] font-extrabold uppercase tracking-[0.06em] text-faint"
                >
                  Patient (refill)
                </Text>
                <Text as="span" className="font-bold text-xs text-ink">
                  {data.patientId
                    ? `${data.patientId}${data.patientName ? " · " + data.patientName : ""}`
                    : "—"}
                </Text>
              </Box>
            </Box>

            {/* lines */}
            <Table className="w-full border-collapse [&_td]:border-b [&_td]:border-[#eef3f0] [&_td]:px-[7px] [&_td]:py-[7px] [&_td]:text-[11.5px] [&_th]:bg-dark [&_th]:px-[7px] [&_th]:py-[7px] [&_th]:text-left [&_th]:text-[9.5px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[0.03em] [&_th]:text-white">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>#</TableHeaderCell>
                  <TableHeaderCell>Medicine</TableHeaderCell>
                  <TableHeaderCell>Batch</TableHeaderCell>
                  <TableHeaderCell>Exp</TableHeaderCell>
                  <TableHeaderCell>HSN</TableHeaderCell>
                  <TableHeaderCell className="text-right">GST%</TableHeaderCell>
                  <TableHeaderCell className="text-right">Qty</TableHeaderCell>
                  <TableHeaderCell className="text-right">MRP</TableHeaderCell>
                  <TableHeaderCell className="text-right">Credit price</TableHeaderCell>
                  <TableHeaderCell className="text-right">Disc%</TableHeaderCell>
                  <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>{rows.map(renderRow)}</TableBody>
            </Table>

            {/* totals */}
            <Box className="ml-auto mt-3 w-[340px]">
              <Box className="flex justify-between py-[5px] text-[12.5px] ">
                <Text as="span">MRP value (for patient billing)</Text>
                <Text as="span" className="font-bold font-display">
                  {inr(mrpTotal)}
                </Text>
              </Box>
              <Box className="my-[3px] flex justify-between border-t border-t-[#cfe0d6] border-b-2 border-b-dark py-2 text-sm font-extrabold text-dark">
                <Text as="span">Billed to hospital (credit, GST incl.)</Text>
                <Text as="span" className="font-bold font-display">
                  {inr(creditTotal)}
                </Text>
              </Box>
              <Box className="flex justify-between py-[5px] text-[12.5px] ">
                <Text as="span">Hospital margin if billed at MRP</Text>
                <Text as="span" className="font-bold text-mid font-display">
                  {inr(margin)}
                </Text>
              </Box>
            </Box>

            <Text className="mt-4 border-t border-dashed border-[#cfe0d6] pt-2.5 text-[9.5px] leading-normal text-muted">
              Goods supplied to the ward and billed to{" "}
              <Text as="span" className="font-bold">
                {account.name}
              </Text>{" "}
              on credit at the institutional rate ({account.discountPct}% off MRP).{" "}
              <Text as="span" className="font-bold">
                MRP
              </Text>{" "}
              is shown so the hospital can bill the patient; the hospital settles this invoice with
              the pharmacy. Prices are GST-inclusive. This is a computer-generated invoice.
            </Text>

            <Box className="ml-auto mt-[22px] w-[200px] text-center text-[10.5px] text-ink-2">
              <Box className="mb-1 block h-7 border-t border-faint" />
              For {profile.name}
              <Box className="h-2" />
              Authorised signatory
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function printOnClick() {
    return window.print();
  }
  function renderRow(
    r: {
      mrp: number;
      disc: number;
      mrpAmount: number;
      amount: number;
      productId: string;
      name: string;
      batchNo: string;
      expiry: string;
      hsn: string;
      gst: number;
      qty: number;
      price: number;
    },
    i: number,
  ) {
    return (
      <TableRow key={i}>
        <TableCell>{i + 1}</TableCell>
        <TableCell className="font-bold text-ink">{r.name}</TableCell>
        <TableCell className="font-mono text-[10.5px] text-ink-2">{r.batchNo}</TableCell>
        <TableCell className="font-mono text-[10.5px] text-ink-2">{r.expiry}</TableCell>
        <TableCell className="font-mono text-[10.5px] text-ink-2">{r.hsn}</TableCell>
        <TableCell className="text-right">{r.gst}%</TableCell>
        <TableCell className="text-right">{r.qty}</TableCell>
        <TableCell className="text-right">{inr(r.mrp)}</TableCell>
        <TableCell className="text-right">
          <Text as="span" className="font-bold">
            {inr(r.price)}
          </Text>
        </TableCell>
        <TableCell className="text-right">{r.disc}%</TableCell>
        <TableCell className="text-right">
          <Text as="span" className="font-bold">
            {inr(r.amount)}
          </Text>
        </TableCell>
      </TableRow>
    );
  }
}

const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  .wsi-print-area, .wsi-print-area * { visibility: visible !important; }
  .wsi-print-area { position: fixed; inset: 0; padding: 12mm; background: #fff; }
  @page { size: A4; margin: 12mm; }
}`;
