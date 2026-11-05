import type { InvProduct, Prescription } from "@/utils";

export type RxCardProps = {
  prescription: Prescription;
  now: number;
  inventory: InvProduct[];
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDispense: () => void;
};
