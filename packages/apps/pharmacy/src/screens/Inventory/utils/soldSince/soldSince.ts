import { InvProduct, Sale } from "@/utils";

export const soldSince = (p: InvProduct, sales: Sale[], since: number) =>
  sales
    .filter((s) => s.status !== "cancelled" && s.createdAt >= since)
    .reduce(
      (a, s) => a + s.items.filter((i) => i.productId === p.id).reduce((x, i) => x + i.qty, 0),
      0,
    );
