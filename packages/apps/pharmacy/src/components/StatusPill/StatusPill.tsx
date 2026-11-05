import { OrderStatus, STATUS_LABEL } from "@/utils";

export function StatusPill({ status }: { status: OrderStatus }) {
  const cls: Record<OrderStatus, string> = {
    new: "pill-gold",
    accepted: "pill-blue",
    packed: "pill-teal",
    out: "pill-blue",
    delivered: "pill-green",
    completed: "pill-green",
    cancelled: "pill-rose",
  };
  return (
    <span className={`pd-pill ${cls[status]}`}>
      <i className="d" />
      {STATUS_LABEL[status]}
    </span>
  );
}
