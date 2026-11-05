import { InvProduct, Sale } from "@/domain";

export const lastSoldAt = (p: InvProduct, sales: Sale[]) =>
  Math.max(
    0,
    ...sales
      .filter((s) => s.status !== "cancelled" && s.items.some((i) => i.productId === p.id))
      .map((s) => s.createdAt),
  );
