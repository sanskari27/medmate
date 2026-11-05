import type { ComponentProps } from "react";
import { Pill, type PillTone } from "@/components/atoms/Pill";
import { STATUS_LABEL, type OrderStatus } from "@/utils";

const statusTone: Record<OrderStatus, PillTone> = {
  new: "gold",
  accepted: "blue",
  packed: "teal",
  out: "blue",
  delivered: "green",
  completed: "green",
  cancelled: "rose",
};

export type StatusPillProps = Omit<ComponentProps<typeof Pill>, "tone" | "children"> & {
  status: OrderStatus;
};

export function StatusPill({ status, ...props }: StatusPillProps) {
  return (
    <Pill tone={statusTone[status]} dot {...props}>
      {STATUS_LABEL[status]}
    </Pill>
  );
}
