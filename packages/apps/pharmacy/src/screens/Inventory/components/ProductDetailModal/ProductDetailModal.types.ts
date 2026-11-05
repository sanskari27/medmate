import type { InvProduct, Sale } from "@/utils";
import type { Route } from "@/types";

export type ProductDetailModalProps = {
  product: InvProduct;
  sales: Sale[];
  now: number;
  onClose: () => void;
  onEdit: () => void;
  toggleOnline: (id: string) => void;
  toggleLoose: (id: string) => void;
  go: (route: Route) => void;
};
