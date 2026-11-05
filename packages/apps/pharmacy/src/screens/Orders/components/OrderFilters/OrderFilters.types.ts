import type { OrderFilter } from "../../Orders.types";

export type OrderFiltersProps = {
  filter: OrderFilter;
  counts: Record<OrderFilter, number>;
  searchQuery: string;
  onFilter: (filter: OrderFilter) => void;
  onSearch: (value: string) => void;
};
