import type { PosCustomer } from "@/store/slices/billing.slice";

export type CustomerBarProps = {
  customer: PosCustomer;
  hasPrescriptionItem: boolean;
  prescriptionReady: boolean;
  onName: (value: string) => void;
  onPhone: (value: string) => void;
  onDoctor: (value: string) => void;
};
