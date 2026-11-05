import type { Patient } from "@/utils/calculations/crm";
import type { CrmViewProps } from "../../Crm.types";

export type PatientModalProps = {
  patient: Patient;
  onClose: () => void;
  view: CrmViewProps;
};
