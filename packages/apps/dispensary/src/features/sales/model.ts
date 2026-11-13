export type SaleRow = {
  id: string;
  type: "sale" | "return";
  invoiceNumber: string;
  patientName: string;
  recordedAt: string;
  items: number;
  amount: string;
};

export type SaleLine = {
  position: number;
  productId: string | null;
  name: string;
  composition: string | null;
  batchNo: string;
  expiry: string;
  qty: number;
  returnedQty: number | null;
  mrp: string | null;
  unitPrice: string | null;
  gst: number | null;
  amount: string;
};

export type SaleDocument = {
  type: "sale" | "return";
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientPhone: string;
  prescribedBy: string | null;
  prescriptionNumber: string | null;
  payMode: string | null;
  recordedAt: string;
  subtotal: string | null;
  discount: string | null;
  payable: string | null;
  extraType: string | null;
  extraValue: string | null;
  extraAmount: string | null;
  amount: string;
  lines: SaleLine[];
};

export type SaleStats = {
  salesThisMonth: string;
  saleCount: number;
  returnsThisMonth: string;
  returnCount: number;
  netThisMonth: string;
};

export type SaleList = {
  sales: SaleRow[];
  stats: SaleStats;
  page?: number;
  size?: number;
  total?: number;
};

export type SaleOne = {
  sale: SaleDocument;
};

export function canOpenSales(role: string | null | undefined, permissions: string[] | undefined) {
  return role === "owner" || (permissions ?? []).includes("sales:read");
}

export function canReturnSale(role: string | null | undefined, permissions: string[] | undefined) {
  return role === "owner" || (permissions ?? []).includes("sales:return");
}

export function typeLabel(type: SaleRow["type"]) {
  return type === "return" ? "Return" : "Sale";
}

export function filterSales(rows: SaleRow[], query: string): SaleRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    [row.id, row.invoiceNumber, row.patientName, typeLabel(row.type)].some((value) =>
      value.toLowerCase().includes(needle),
    ),
  );
}

export function inr2(amount: string) {
  const negative = amount.startsWith("-");
  const body = (Math.abs(toPaise(amount)) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return negative ? `-₹${body}` : `₹${body}`;
}

export function saleDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function refundAmount(
  lines: Pick<SaleLine, "position" | "qty" | "unitPrice" | "returnedQty">[],
  extraAmount: string,
  requested: { position: number; qty: number }[],
) {
  const ordered = [...lines].sort((left, right) => left.position - right.position);
  const nets = ordered.map((line) => toPaise(line.unitPrice ?? "0") * line.qty);
  const shares = extraShares(nets, toPaise(extraAmount));
  const payable = new Map(
    ordered.map((line, index) => [line.position, (nets[index] ?? 0) - (shares[index] ?? 0)]),
  );
  let total = 0;
  for (const request of requested) {
    const line = ordered.find((item) => item.position === request.position);
    if (!line || request.qty < 1) continue;
    total += unitRefund(
      payable.get(line.position) ?? 0,
      line.qty,
      line.returnedQty ?? 0,
      request.qty,
    );
  }
  return fromPaise(total);
}

export function returnDraft(lines: SaleLine[], qty: Record<number, string>, extraAmount: string) {
  const rows = lines.map((line) => {
    const remaining = line.qty - (line.returnedQty ?? 0);
    const raw = qty[line.position] ?? "";
    const parsed = raw === "" ? 0 : /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
    return {
      position: line.position,
      qty: Number.isInteger(parsed) ? parsed : 0,
      ok: Number.isInteger(parsed) && parsed >= 0 && parsed <= remaining,
    };
  });
  const active = rows.filter((row) => row.ok && row.qty > 0);
  const ready = rows.every((row) => row.ok) && active.length > 0;
  return {
    rows,
    ready,
    amount: ready
      ? refundAmount(
          lines,
          extraAmount,
          active.map((row) => ({ position: row.position, qty: row.qty })),
        )
      : "0.00",
  };
}

function extraShares(nets: number[], extra: number) {
  const shares = nets.map(() => 0);
  const positive: number[] = [];
  let billNet = 0;
  nets.forEach((net, index) => {
    if (net > 0) {
      positive.push(index);
      billNet += net;
    }
  });
  if (positive.length === 0 || extra === 0) return shares;
  let given = 0;
  for (let index = 0; index < positive.length - 1; index += 1) {
    const line = positive[index] ?? 0;
    const share = divideHalfUp(extra * (nets[line] ?? 0), billNet);
    shares[line] = share;
    given += share;
  }
  const last = positive[positive.length - 1] ?? 0;
  shares[last] = extra - given;
  return shares;
}

function unitRefund(linePayable: number, qty: number, already: number, take: number) {
  const base = Math.floor(linePayable / qty);
  const remainder = linePayable - base * qty;
  let sum = 0;
  for (let index = already; index < already + take; index += 1) {
    sum += base + (index < remainder ? 1 : 0);
  }
  return sum;
}

function divideHalfUp(numerator: number, denominator: number) {
  const negative = numerator < 0;
  const value = Math.abs(numerator);
  const base = Math.floor(value / denominator);
  const bump = (value % denominator) * 2 >= denominator ? 1 : 0;
  return negative ? -(base + bump) : base + bump;
}

function toPaise(value: string) {
  const negative = value.startsWith("-");
  const [whole, frac = ""] = value.replace("-", "").split(".");
  const paise = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  return negative ? -paise : paise;
}

function fromPaise(paise: number) {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
