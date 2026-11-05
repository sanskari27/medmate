import type { InventoryFilter, InventorySnapshot } from "../../Inventory.utils";

export type InventoryStatsProps = {
  snapshot: InventorySnapshot;
  onFilter: (filter: InventoryFilter) => void;
};
