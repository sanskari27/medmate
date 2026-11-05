import type { PillTone } from "@/components/atoms/Pill";
import { isLowStock, looseUnitsOf, stockLabel, stockOf, type InvProduct } from "@/utils";

export function stockPillView(product: InvProduct): { tone: PillTone; label: string } {
  const strips = stockOf(product);
  const loose = looseUnitsOf(product);
  if (strips <= 0 && loose <= 0) return { tone: "rose", label: "Out of stock" };
  const label = stockLabel(product);
  if (isLowStock(product)) return { tone: "gold", label: `Low · ${label}` };
  return { tone: "green", label };
}
