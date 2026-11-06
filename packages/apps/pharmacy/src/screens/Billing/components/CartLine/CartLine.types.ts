import type { PosLine } from "@/store/slices/billing.slice";
import type { BillingLineView } from "../../Billing.utils";

export type CartLineProps = {
  line: PosLine;
  view: BillingLineView;
  onDecrease: (productId: string, loose: boolean, batchNo?: string) => void;
  onIncrease: (productId: string, loose: boolean, batchNo?: string) => void;
  onQuantity: (productId: string, quantity: number, loose: boolean, batchNo?: string) => void;
  onRemove: (productId: string, loose: boolean, batchNo?: string) => void;
  onBatch: (productId: string, batchNo: string | undefined, loose: boolean) => void;
};
