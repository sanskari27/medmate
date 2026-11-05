import type { Channel, OrderStatus, PayMode } from "@/utils";

export type SalesSortKey = "date" | "total" | "items" | "customer";
export type SortDirection = "asc" | "desc";
export type PaidFilter = "all" | "paid" | "unpaid";

export type SalesQuery = {
  channel: "all" | Channel;
  payMode: "all" | PayMode;
  status: "all" | OrderStatus;
  paid: PaidFilter;
  searchQuery: string;
  sort: SalesSortKey;
  direction: SortDirection;
};
