import type { Prescription } from "@/utils";

export type RejectModalProps = {
  rx: Prescription;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};
