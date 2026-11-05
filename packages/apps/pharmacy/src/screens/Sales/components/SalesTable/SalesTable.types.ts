import type { PayMode, Sale } from "@/utils";
import type { SalesSortKey, SortDirection } from "../../Sales.types";
import type { SalesRow } from "../../Sales.utils";

export type SalesTableProps = {
  rows: SalesRow[];
  sort: SalesSortKey;
  direction: SortDirection;
  now: number;
  tax: string;
  net: string;
  units: number;
  onSort: (key: SalesSortKey) => void;
  onOpen: (sale: Sale, tab: "history" | "invoice") => void;
  onMarkPaid: (id: string, payMode: PayMode) => void;
  onShare: (sale: Sale) => void;
};
