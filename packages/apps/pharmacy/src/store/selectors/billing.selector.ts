import { billUnit, computeInvoice } from "@/utils";
import type { RootState } from "@/store";

export type PosItem = {
  p: RootState["inventory"]["inventory"][number];
  qty: number;
  loose: boolean;
  batchNo?: string;
};

export function selectPosItems(state: RootState): PosItem[] {
  return state.billing.pos.flatMap((line) => {
    const product = state.inventory.inventory.find((item) => item.id === line.productId);
    if (!product) return [];
    return [{ p: product, qty: line.qty, loose: !!line.loose, batchNo: line.batchNo }];
  });
}

export function selectPosCount(state: RootState) {
  return selectPosItems(state).reduce((sum, item) => sum + (item.loose ? 1 : item.qty), 0);
}

export function selectPosDiscountFlat(state: RootState) {
  const items = selectPosItems(state);
  const gross = items.reduce(
    (sum, item) =>
      sum + billUnit(item.p, { loose: item.loose, batchNo: item.batchNo }).price * item.qty,
    0,
  );
  const entered = state.billing.posDiscount || 0;
  const effective =
    state.billing.posDiscountMode === "percent" ? Math.round((gross * entered) / 100) : entered;
  return Math.max(0, Math.min(effective, gross));
}

export function selectPosTotals(state: RootState) {
  const discount = selectPosDiscountFlat(state);
  return computeInvoice(
    selectPosItems(state).map((item) => {
      const unit = billUnit(item.p, { loose: item.loose, batchNo: item.batchNo });
      return { qty: item.qty, mrp: unit.mrp, price: unit.price, gst: item.p.gst };
    }),
    discount,
  );
}
