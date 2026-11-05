import type { InventoryFilter } from "../../Inventory.utils";

export type InventoryToolbarProps = {
  filter: InventoryFilter;
  alertCount: number;
  unallocatedCount: number;
  searchQuery: string;
  canExport: boolean;
  onFilter: (filter: InventoryFilter) => void;
  onSearch: (value: string) => void;
  onExcel: () => void;
  onPdf: () => void;
  onRackMap: () => void;
  onSample: () => void;
  onImportFile: (file: File) => void;
  onAddStock: () => void;
};
