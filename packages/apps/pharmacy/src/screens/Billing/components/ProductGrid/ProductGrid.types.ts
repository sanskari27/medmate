import type { InvProduct } from "@/utils";

export type ProductGridProps = {
  products: InvProduct[];
  searchQuery: string;
  packQty: (productId: string) => number;
  looseQty: (productId: string) => number;
  onAddPack: (productId: string) => void;
  onAddLoose: (productId: string) => void;
};
