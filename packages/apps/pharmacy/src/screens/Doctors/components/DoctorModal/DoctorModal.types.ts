import type { DoctorProfile } from "@/utils/calculations/hospital";
import type { DoctorDraft } from "@/screens/Doctors/Doctors.types";

export type DoctorModalProps = {
  initial: DoctorProfile | null;
  departments: string[];
  onClose: () => void;
  onSave: (draft: DoctorDraft) => void;
};
