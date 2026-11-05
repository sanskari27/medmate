import type { Admission } from "@/utils/calculations/hospital";

export type AdmissionModalProps = {
  adm: Admission;
  onClose: () => void;
};
