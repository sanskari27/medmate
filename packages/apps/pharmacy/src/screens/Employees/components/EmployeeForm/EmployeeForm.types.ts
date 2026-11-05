import type { Employee } from "@/utils";
import type { EmployeeDraft } from "@/screens/Employees/Employees.types";

export type EmployeeFormProps = {
  initial: Employee | null;
  onClose: () => void;
  onSave: (draft: EmployeeDraft) => void;
  now: number;
  onIdCard?: () => void;
};
