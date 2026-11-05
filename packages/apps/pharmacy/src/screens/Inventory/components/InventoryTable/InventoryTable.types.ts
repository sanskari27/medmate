import type { InvProduct } from "@/utils";
import type { Route } from "@/types";

export type InventoryTableProps = {
  products: InvProduct[];
  catalogueEmpty: boolean;
  now: number;
  onOpen: (product: InvProduct) => void;
  onEdit: (product: InvProduct) => void;
  onToggleLoose: (id: string) => void;
  onToggleOnline: (id: string) => void;
  onGo: (route: Route) => void;
};
