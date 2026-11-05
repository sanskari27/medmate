import type { PayMode, Sale } from "@/utils";
import type { OrderTab } from "../../Orders.types";

export type OrderTableProps = {
  sales: Sale[];
  now: number;
  onOpen: (sale: Sale, tab: OrderTab) => void;
  onMarkPaid: (id: string, payMode: PayMode) => void;
  onAdvance: (id: string) => void;
  onCancel: (id: string) => void;
  onPack: (id: string) => void;
  onShare: (sale: Sale) => void;
};
