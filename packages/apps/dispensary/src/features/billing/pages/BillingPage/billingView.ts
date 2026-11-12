import type { InventoryBatch, InventoryProduct } from "@/features/inventory";
import type { Offer } from "@/features/offers";
import {
  discountAmount,
  includedGst,
  priceLine,
  round2,
  sellableBatches,
  type CartLine,
  type DiscountKind,
} from "../../model";

export function rupee(value: number) {
  return `₹${round2(value).toFixed(2)}`;
}

export function batchLabel(batch: InventoryBatch) {
  return `${batch.batchNo} · ${batch.expiry} · ${batch.qty} · ₹${batch.mrp}`;
}

export function shortComposition(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  if (!text) return "No composition";
  const first = text.split(/[+/,]/)[0]?.trim() || text;
  return first.length > 22 ? `${first.slice(0, 22)}…` : first;
}

export function lineFigures(
  line: CartLine,
  product: InventoryProduct | undefined,
  batch: InventoryBatch | null,
  offers: Offer[],
) {
  if (!product || !batch || batch.gst == null) return null;
  const priced = priceLine(offers, line.productId, Number(batch.mrp), line.qty, {
    type: line.discountType,
    value: line.discountValue,
  });
  const tax = includedGst(priced.net, batch.gst);
  return {
    ...priced,
    ...tax,
    gross: round2(priced.mrp * line.qty),
    rate: batch.gst,
  };
}

export function billTotals(
  lines: CartLine[],
  products: InventoryProduct[],
  offers: Offer[],
  billDiscount: { type: DiscountKind; value: number },
) {
  let subtotal = 0;
  let offerSum = 0;
  let lineExtra = 0;
  let net = 0;
  let cgst = 0;
  let sgst = 0;
  let gst = 0;
  let units = 0;
  for (const line of lines) {
    const product = products.find((item) => item.productId === line.productId);
    const batch =
      product && line.batchNo
        ? sellableBatches(product).find((item) => item.batchNo === line.batchNo)
        : null;
    const view = lineFigures(line, product, batch ?? null, offers);
    if (!view) continue;
    subtotal += view.gross;
    offerSum += view.offerDiscount;
    lineExtra += view.extraDiscount;
    net += view.net;
    cgst += view.cgst;
    sgst += view.sgst;
    gst += view.gst;
    units += line.qty;
  }
  const netRounded = round2(net);
  const billOff = discountAmount(billDiscount, netRounded);
  const gstRounded = round2(gst);
  const payable = round2(netRounded - billOff);
  return {
    lines: lines.length,
    units,
    subtotal: round2(subtotal),
    offers: round2(offerSum),
    lineExtra: round2(lineExtra),
    billOff,
    savings: round2(offerSum + lineExtra + billOff),
    taxable: round2(Math.max(0, netRounded - gstRounded)),
    cgst: round2(cgst),
    sgst: round2(sgst),
    gst: gstRounded,
    payable,
  };
}

export type BillTotals = ReturnType<typeof billTotals>;
