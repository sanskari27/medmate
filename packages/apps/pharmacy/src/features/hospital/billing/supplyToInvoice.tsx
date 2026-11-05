import { WardSupply } from "@/features/hospital/hospitalAccount";
import { SupplyInvoiceData } from "@/features/hospital/billing/WardSupplyInvoice";

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
