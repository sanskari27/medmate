import type { InvProduct } from "@/utils";

export type ProductCardProps = {
  product: InvProduct;
  packCount: number;
  looseCount: number;
  onAddPack: (productId: string) => void;
  onAddLoose: (productId: string) => void;
};
