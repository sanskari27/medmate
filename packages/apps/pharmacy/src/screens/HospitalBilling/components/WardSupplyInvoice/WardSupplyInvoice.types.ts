import type { PharmacyProfile } from "@/utils";
import type {
  HospitalAccount,
  WardSupplyItem,
  WardSupplyReason,
} from "@/utils/calculations/hospitalAccount";

export type SupplyInvoiceData = {
  invoiceNo: string;
  at: number;
  wardName: string;
  reason: WardSupplyReason;
  patientId?: string;
  patientName?: string;
  refDoc?: string;
  indentId?: string;
  items: WardSupplyItem[];
};

export type WardSupplyInvoiceProps = {
  data: SupplyInvoiceData;
  profile: PharmacyProfile;
  account: HospitalAccount;
  onClose: () => void;
  onEdit?: () => void;
  onConfirm?: () => void;
};
