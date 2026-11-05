import type { PillTone } from "@/components/atoms/Pill";
import {
  computeInvoice,
  fmtDateTime,
  PAY_LABEL,
  SALE_SOURCE_LABEL,
  SALE_SOURCES,
  saleSourceOf,
  type PharmacyProfile,
  type Sale,
  type SaleSource,
} from "@/utils";
import { buildReportPdf } from "@/utils/pdf";
import type { RegisterQuery } from "./SalesRegister.types";

export function salePayable(sale: Sale) {
  return computeInvoice(sale.items, sale.discount).payable;
}

export function registerBase(sales: Sale[], inWindow: (createdAt: number) => boolean) {
  return sales.filter(function kept(sale) {
    return sale.status !== "cancelled" && inWindow(sale.createdAt);
  });
}

export function registerInsurers(sales: Sale[]) {
  return Array.from(
    new Set(
      sales.filter(function insured(sale) {
        return Boolean(sale.insurer);
      }).map(function name(sale) {
        return sale.insurer as string;
      }),
    ),
  ).sort();
}

export function registerWards(sales: Sale[]) {
  return Array.from(
    new Set(
      sales.filter(function placed(sale) {
        return Boolean(sale.ward);
      }).map(function name(sale) {
        return sale.ward as string;
      }),
    ),
  ).sort();
}

export function filterRegister(sales: Sale[], query: RegisterQuery) {
  const needle = query.searchQuery.trim().toLowerCase();
  return sales
    .filter(function bySource(sale) {
      return query.source === "all" || saleSourceOf(sale) === query.source;
    })
    .filter(function byPay(sale) {
      return query.payMode === "all" || sale.payMode === query.payMode;
    })
    .filter(function byPaid(sale) {
      if (query.paid === "all") return true;
      return query.paid === "paid" ? sale.paid !== false : sale.paid === false;
    })
    .filter(function byInsurer(sale) {
      return query.insurer === "all" || sale.insurer === query.insurer;
    })
    .filter(function byWard(sale) {
      return query.ward === "all" || sale.ward === query.ward;
    })
    .filter(function byQuery(sale) {
      if (!needle) return true;
      return `${sale.id} ${sale.customer.name} ${sale.customer.phone ?? ""} ${sale.insurer ?? ""} ${sale.ward ?? ""}`
        .toLowerCase()
        .includes(needle);
    })
    .sort(function newest(left, right) {
      return right.createdAt - left.createdAt;
    });
}

export function registerTotals(rows: Sale[]) {
  return {
    revenue: sumPayable(rows),
    paid: sumPayable(rows.filter(function settled(sale) {
      return sale.paid !== false;
    })),
    unpaid: sumPayable(rows.filter(function pending(sale) {
      return sale.paid === false;
    })),
    insurance: sumPayable(rows.filter(function insured(sale) {
      return sale.payMode === "insurance";
    })),
  };
}

export type SourceCard = {
  key: SaleSource;
  label: string;
  short: string;
  count: number;
  amount: number;
};

export function sourceBreakdown(sales: Sale[]): SourceCard[] {
  return SALE_SOURCES.map(function card(source) {
    const list = sales.filter(function fromSource(sale) {
      return saleSourceOf(sale) === source.key;
    });
    return { ...source, count: list.length, amount: sumPayable(list) };
  });
}

const SOURCE_TONE: Record<SaleSource, PillTone> = {
  opd: "blue",
  counter: "gray",
  ward: "gold",
  emergency: "rose",
  online: "teal",
};

export function sourceTone(source: SaleSource): PillTone {
  return SOURCE_TONE[source];
}

export function doctorLabel(doctor: string) {
  return doctor.replace(/^Dr\.?\s*/i, "");
}

export function registerCsv(rows: Sale[]) {
  const head = ["Invoice", "Date", "Source", "Patient/Customer", "Ward", "Payment", "Insurer", "Paid", "Amount"];
  const lines = rows.map(function toLine(sale) {
    return [
      sale.id,
      fmtDateTime(sale.createdAt),
      SALE_SOURCE_LABEL[saleSourceOf(sale)],
      sale.customer.name,
      sale.ward ?? "",
      PAY_LABEL[sale.payMode],
      sale.insurer ?? "",
      sale.paid === false ? "Unpaid" : "Paid",
      Math.round(salePayable(sale)),
    ];
  });
  return [head, ...lines]
    .map(function joinRow(cells: Array<string | number>) {
      return cells.map(function quote(cell) {
        return `"${String(cell).replace(/"/g, '""')}"`;
      }).join(",");
    })
    .join("\n");
}

export function registerPdfBlob(
  rows: Sale[],
  totals: ReturnType<typeof registerTotals>,
  label: string,
  source: "all" | SaleSource,
  profile: PharmacyProfile,
  now: number,
) {
  const headerLine = "Invoice    Date              Source     Patient            Payment      Paid    Amount";
  const rowLines = rows.map(function toPdf(sale) {
    const sourceShort = SALE_SOURCES.find(function named(item) {
      return item.key === saleSourceOf(sale);
    })!.short;
    return `${clip(sale.id, 10)} ${clip(fmtDateTime(sale.createdAt), 17)} ${clip(sourceShort, 10)} ${clip(sale.customer.name, 18)} ${clip(PAY_LABEL[sale.payMode], 12)} ${clip(sale.paid === false ? "Unpaid" : "Paid", 7)} ${("Rs " + Math.round(salePayable(sale))).padStart(9)}`;
  });
  return buildReportPdf({
    title: "Hospital Sales Register",
    subtitle: `${label} · ${rows.length} sales · ${source === "all" ? "all sources" : SALE_SOURCE_LABEL[source]}`,
    generatedAt: fmtDateTime(now),
    profile,
    headerLine,
    rowLines,
    totalsLine: `Total: Rs ${Math.round(totals.revenue)}   ·   Paid: Rs ${Math.round(totals.paid)}   ·   Unpaid: Rs ${Math.round(totals.unpaid)}`,
  });
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(function release() {
    URL.revokeObjectURL(url);
  }, 6000);
}

function sumPayable(rows: Sale[]) {
  return rows.reduce(function add(sum, sale) {
    return sum + salePayable(sale);
  }, 0);
}

function clip(value: string, width: number) {
  return value.length > width ? value.slice(0, width - 1) + "…" : value.padEnd(width);
}
