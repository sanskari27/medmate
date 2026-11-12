export type InvoiceLine = {
  name: string;
  batchNo: string;
  expiry: string;
  qty: number;
  mrp: number;
  price: number;
  gst: number;
};

export type TaxLine = {
  gst: number;
  taxable: number;
  cgst: number;
  sgst: number;
};

export type InvoiceTotals = {
  gross: number;
  discount: number;
  taxable: number;
  roundOff: number;
  payable: number;
  savings: number;
  lines: TaxLine[];
};

export const SAMPLE_CUSTOMER = {
  name: "Preview",
  phone: "9886012345",
  doctor: "Dr. Rao",
  address: "14 Residency Road, Bengaluru",
};

export const FOOTER_NOTE = "Thank you — get well soon! Powered by Namma MedMate.";

export const SAMPLE_LINES: InvoiceLine[] = [
  {
    name: "Paracetamol 500mg",
    batchNo: "PRE-12",
    expiry: "12/2027",
    qty: 2,
    mrp: 30,
    price: 24,
    gst: 12,
  },
  {
    name: "Cetirizine 10mg",
    batchNo: "PRE-7",
    expiry: "06/2027",
    qty: 1,
    mrp: 18,
    price: 15,
    gst: 5,
  },
];

export function sampleNumber(prefix: string) {
  return `${prefix.trim()}PREVIEW`;
}

export function computeInvoice(items: InvoiceLine[], discount = 0): InvoiceTotals {
  const gross = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const mrpTotal = items.reduce((sum, item) => sum + item.mrp * item.qty, 0);
  const discountApplied = Math.min(discount, gross);
  const net = gross - discountApplied;
  const keptShare = gross > 0 ? net / gross : 1;
  const inclusiveByRate = new Map<number, number>();
  for (const item of items) {
    const lineAfterDiscount = item.price * item.qty * keptShare;
    inclusiveByRate.set(item.gst, (inclusiveByRate.get(item.gst) ?? 0) + lineAfterDiscount);
  }
  const lines: TaxLine[] = [];
  let taxable = 0;
  const slabs = [...inclusiveByRate.entries()].sort((left, right) => left[0] - right[0]);
  for (const [gstRate, inclusiveAmount] of slabs) {
    const tax = inclusiveAmount - inclusiveAmount / (1 + gstRate / 100);
    taxable += inclusiveAmount - tax;
    lines.push({ gst: gstRate, taxable: inclusiveAmount - tax, cgst: tax / 2, sgst: tax / 2 });
  }
  const payable = Math.round(net);
  return {
    gross,
    discount: discountApplied,
    taxable,
    roundOff: payable - net,
    payable,
    savings: mrpTotal - gross + discountApplied,
    lines,
  };
}

export function formatInr(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatInr2(value: number) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatWhen(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
