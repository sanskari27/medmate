import type { Channel, OrderStatus, PayMode } from "@/utils";
import type { PaidFilter } from "../../Sales.types";

export type SalesFiltersProps = {
  searchQuery: string;
  channel: "all" | Channel;
  payMode: "all" | PayMode;
  status: "all" | OrderStatus;
  paid: PaidFilter;
  onSearch: (value: string) => void;
  onChannel: (value: "all" | Channel) => void;
  onPayMode: (value: "all" | PayMode) => void;
  onStatus: (value: "all" | OrderStatus) => void;
  onPaid: (value: PaidFilter) => void;
};
