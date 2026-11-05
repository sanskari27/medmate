import type { InvProduct, Prescription } from "@/utils";

export type RxDetailProps = {
  rx: Prescription;
  inventory: InvProduct[];
  now: number;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDispense: () => void;
};
