import { InvProduct } from "@/domain";

export const mrpValueOf = (p: InvProduct) => p.batches.reduce((a, b) => a + b.qty * b.mrp, 0);
