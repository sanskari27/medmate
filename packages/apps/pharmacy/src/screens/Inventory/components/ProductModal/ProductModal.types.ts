import type { InvProduct } from "@/utils";

export type ProductModalProps = {
  product: InvProduct;
  onClose: () => void;
  onSave: (product: InvProduct) => void;
};
