import type { CSSProperties } from "react";
import {
  billUnit,
  earliestBatch,
  matchesLocation,
  stockOf,
  totalUnits,
  type Batch,
  type InvProduct,
} from "@/utils";
import type { PosLine } from "@/store/slices/billing/billingSlice";

export type BillingLineView = {
  product: InvProduct;
  loose: boolean;
  pinned: Batch | null;
  batch: Batch | null;
  unit: number;
  maxQty: number;
};

export function billingLineKey(line: PosLine): string {
  return `${line.productId}${line.loose ? "L" : ""}-${line.batchNo ?? "auto"}`;
}

export function billingLineView(line: PosLine, inventory: InvProduct[]): BillingLineView | null {
  const product = inventory.find((item) => item.id === line.productId);
  if (!product) return null;
  const loose = !!line.loose;
  const pinned =
    !loose && line.batchNo
      ? (product.batches.find((batch) => batch.batchNo === line.batchNo) ?? null)
      : null;
  const batch = pinned ?? earliestBatch(product);
  const unit = billUnit(product, { loose, batchNo: batch?.batchNo }).price;
  const maxQty = loose ? totalUnits(product) : pinned ? pinned.qty : stockOf(product);
  return { product, loose, pinned, batch, unit, maxQty };
}

export function filterBillingProducts(
  inventory: InvProduct[],
  category: string,
  query: string,
): InvProduct[] {
  const needle = query.trim().toLowerCase();
  return inventory.filter((product) => {
    if (category !== "all" && product.category !== category) return false;
    if (!needle) return true;
    const haystack = `${product.name} ${product.composition} ${product.manufacturer}`.toLowerCase();
    return haystack.includes(needle) || matchesLocation(product, query);
  });
}

export function billingInvoiceTitle(sale: { id: string; payMode: string; paid?: boolean }) {
  if (sale.payMode === "credit") return `Bill ${sale.id} · on credit (khata)`;
  if (sale.paid === false) return `Bill ${sale.id} · sent to reception`;
  return `Invoice ${sale.id} · created`;
}

function selectChevron(stroke: string) {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${stroke}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;
}

export const billingSelectClass =
  "cursor-pointer appearance-none bg-[length:16px_16px] bg-[position:right_11px_center] bg-no-repeat pr-[34px] [background-image:var(--select-chevron)] hover:[background-image:var(--select-chevron-hover)]";

export const billingSelectStyle = {
  "--select-chevron": selectChevron("%232F7D52"),
  "--select-chevron-hover": selectChevron("%231B3D29"),
} as CSSProperties;

export function billingCheckoutGates(input: {
  hasPrescriptionItem: boolean;
  doctor: string;
  payMode: string;
  customerName: string;
  insurer: string;
  isHospital: boolean;
  source: string;
  ward: string;
}) {
  const prescriptionReady = !input.hasPrescriptionItem || input.doctor.trim().length > 0;
  const creditReady = input.payMode !== "credit" || input.customerName.trim().length > 0;
  const insurerReady = input.payMode !== "insurance" || input.insurer.trim().length > 0;
  const wardReady = !input.isHospital || input.source !== "ward" || input.ward.trim().length > 0;
  return {
    prescriptionReady,
    creditReady,
    insurerReady,
    wardReady,
    detailsReady: prescriptionReady && wardReady,
    readyToBill: prescriptionReady && creditReady && insurerReady && wardReady,
  };
}
