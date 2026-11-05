import { SupplyEntry } from "@/domain";

export const multiSourceCount = (list: SupplyEntry[]) => {
  const m: Record<string, number> = {};
  list.forEach((e) => {
    m[e.productId] = (m[e.productId] || 0) + 1;
  });
  return Object.values(m).filter((n) => n > 1).length;
};
