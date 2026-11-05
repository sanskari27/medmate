import type { ComponentProps } from "react";
import { Pill } from "@/components/atoms/Pill";
import { stockPillView } from "./StockPill.utils";
import type { StockPillProps } from "./StockPill.types";

export function StockPill({
  p,
  now: _now,
  className,
  ...props
}: StockPillProps & Omit<ComponentProps<typeof Pill>, "tone" | "children">) {
  const view = stockPillView(p);
  return (
    <Pill tone={view.tone} dot className={className} {...props}>
      {view.label}
    </Pill>
  );
}
