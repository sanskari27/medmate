import { InvProduct, stockOf, isLowStock, looseUnitsOf, stockLabel } from "@/utils";

export function StockPill({ p }: { p: InvProduct; now?: number }) {
  const strips = stockOf(p);
  const loose = looseUnitsOf(p);
  if (strips <= 0 && loose <= 0)
    return (
      <span className="pd-pill pill-rose">
        <i className="d" />
        Out of stock
      </span>
    );
  const label = stockLabel(p);
  if (isLowStock(p))
    return (
      <span className="pd-pill pill-gold">
        <i className="d" />
        Low · {label}
      </span>
    );
  return (
    <span className="pd-pill pill-green">
      <i className="d" />
      {label}
    </span>
  );
}
