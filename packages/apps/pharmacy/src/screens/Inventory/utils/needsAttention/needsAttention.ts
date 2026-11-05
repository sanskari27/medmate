import { stockOf, isLowStock, isExpiringSoon, InvProduct } from "@/utils";

export const needsAttention = (p: InvProduct, now: number) =>
  isLowStock(p) || stockOf(p) === 0 || isExpiringSoon(p, now);
