import type { InvProduct, SaleSource } from "@/utils";
import type { PosCustomer, PosLine } from "@/store/slices/billing.slice";

export type OrderReviewProps = {
  count: number;
  customer: PosCustomer;
  hasPrescriptionItem: boolean;
  isHospital: boolean;
  sourceLabel: string;
  source: SaleSource;
  ward: string;
  patientId: string;
  lines: PosLine[];
  inventory: InvProduct[];
  onEdit: () => void;
};
