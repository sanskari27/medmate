import { Sale, Prescription } from "@/domain";

export function matchRx(prescriptions: Prescription[], s: Sale): Prescription | undefined {
  if (!s.rx) return undefined;
  return prescriptions.find((r) => r.patient.toLowerCase() === s.customer.name.toLowerCase());
}
