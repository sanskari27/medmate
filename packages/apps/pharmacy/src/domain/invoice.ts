// ── GST-inclusive invoice maths ─────────────────────────────────
// MRP/selling price is GST-inclusive (Indian retail). We back out the
// taxable value and split tax into CGST + SGST (intra-state).
export type TaxLine = { gst: number; taxable: number; cgst: number; sgst: number };
export type InvoiceTotals = {
  gross: number; // sum(price*qty), GST-inclusive
  discount: number;
  net: number; // gross - discount (inclusive)
  taxable: number; // net ex-GST
  totalTax: number;
  cgst: number;
  sgst: number;
  roundOff: number;
  payable: number; // rounded net
  lines: TaxLine[]; // tax slab breakup
  savings: number; // MRP savings vs gross
};

export function computeInvoice(
  items: { qty: number; mrp: number; price: number; gst: number }[],
  discount = 0,
): InvoiceTotals {
  const gross = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const mrpTotal = items.reduce((sum, item) => sum + item.mrp * item.qty, 0);
  const discountApplied = Math.min(discount, gross);
  const net = gross - discountApplied;
  // A bill discount is not on one line. Each line keeps the same share of the net.
  const keptShare = gross > 0 ? net / gross : 1;

  const inclusiveByRate = new Map<number, number>();
  for (const item of items) {
    const lineAfterDiscount = item.price * item.qty * keptShare;
    inclusiveByRate.set(item.gst, (inclusiveByRate.get(item.gst) ?? 0) + lineAfterDiscount);
  }

  const lines: TaxLine[] = [];
  let taxable = 0;
  let totalTax = 0;
  const slabs = [...inclusiveByRate.entries()].sort((left, right) => left[0] - right[0]);
  for (const [gstRate, inclusiveAmount] of slabs) {
    // The selling price already includes GST, so tax is backed out of that amount.
    const tax = inclusiveAmount - inclusiveAmount / (1 + gstRate / 100);
    const taxableOnSlab = inclusiveAmount - tax;
    taxable += taxableOnSlab;
    totalTax += tax;
    lines.push({ gst: gstRate, taxable: taxableOnSlab, cgst: tax / 2, sgst: tax / 2 });
  }

  const payable = Math.round(net);
  return {
    gross,
    discount: discountApplied,
    net,
    taxable,
    totalTax,
    cgst: totalTax / 2,
    sgst: totalTax / 2,
    roundOff: payable - net,
    payable,
    lines,
    savings: mrpTotal - gross + discountApplied,
  };
}
