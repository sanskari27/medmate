import { WardSupply } from "@/utils/calculations/hospitalAccount";
import { SupplyInvoiceData } from "@/screens/HospitalBilling/components/WardSupplyInvoice";

export const supplyToInvoice = (s: WardSupply): SupplyInvoiceData => ({
  invoiceNo: s.id,
  at: s.at,
  wardName: s.wardName,
  reason: s.reason,
  patientId: s.patientId,
  patientName: s.patientName,
  refDoc: s.refDoc,
  indentId: s.indentId,
  items: s.items,
});
