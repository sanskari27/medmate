import type { Employee, PharmacyProfile } from "@/utils";

export type EmployeeIdCardProps = {
  employee: Employee;
  profile: PharmacyProfile;
  onClose: () => void;
};
