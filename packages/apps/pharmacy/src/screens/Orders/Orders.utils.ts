import { computeInvoice, ONLINE_FLOW, type OrderStatus, type Sale, type StatusEvent } from "@/utils";
import type { PillTone } from "@/components/atoms/Pill";
import type { OrderFilter } from "./Orders.types";

export function orderPayable(sale: Sale) {
  return computeInvoice(sale.items, sale.discount).payable;
}

export function filterOrders(sales: Sale[], filter: OrderFilter, searchQuery: string) {
  const needle = searchQuery.trim().toLowerCase();
  return [...sales].sort(function newest(left, right) {
    return right.createdAt - left.createdAt;
  }).filter(function matches(sale) {
    if (filter === "online" && sale.channel !== "online") return false;
    if (filter === "offline" && sale.channel !== "offline") return false;
    if (filter === "action" && !needsAction(sale)) return false;
    if (filter === "unpaid" && !(sale.paid === false && sale.status !== "cancelled")) return false;
    if (needle && !`${sale.id} ${sale.customer.name} ${sale.customer.phone ?? ""}`.toLowerCase().includes(needle)) {
      return false;
    }
    return true;
  });
}

export function orderCounts(sales: Sale[]) {
  return {
    all: sales.length,
    online: sales.filter(function online(sale) {
      return sale.channel === "online";
    }).length,
    offline: sales.filter(function offline(sale) {
      return sale.channel === "offline";
    }).length,
    action: sales.filter(needsAction).length,
    unpaid: sales.filter(function unpaid(sale) {
      return sale.paid === false && sale.status !== "cancelled";
    }).length,
  };
}

export type HistoryEntry = StatusEvent & { future?: boolean };

export function orderHistory(sale: Sale) {
  const history: HistoryEntry[] = [...(sale.history ?? [{ status: sale.status, at: sale.createdAt }])].sort(
    function oldest(left, right) {
      return left.at - right.at;
    },
  );
  const index = ONLINE_FLOW.indexOf(sale.status);
  const future: HistoryEntry[] =
    sale.channel === "online" && sale.status !== "cancelled"
      ? ONLINE_FLOW.slice(index + 1).map(function pending(status) {
          return { status, at: 0, future: true };
        })
      : [];
  return { history, future, totals: computeInvoice(sale.items, sale.discount) };
}

const RX_TONE: Record<string, PillTone> = {
  pending: "gold",
  approved: "blue",
  dispensed: "green",
  rejected: "rose",
};

export function rxStatusTone(status: string): PillTone {
  return RX_TONE[status] ?? "gray";
}

export type PackStep = "pack" | "handover" | "done";

const PACK_STEPS: PackStep[] = ["pack", "handover", "done"];

export function packStepOf(status: OrderStatus): PackStep {
  if (status === "accepted") return "pack";
  if (status === "packed") return "handover";
  return "done";
}

export function packRailTone(current: PackStep, key: PackStep): "done" | "on" | "idle" {
  const at = PACK_STEPS.indexOf(key);
  const cursor = PACK_STEPS.indexOf(current);
  if (at < cursor) return "done";
  if (at === cursor) return "on";
  return "idle";
}

function needsAction(sale: Sale) {
  return sale.channel === "online" && (sale.status === "new" || sale.status === "accepted" || sale.status === "packed");
}
