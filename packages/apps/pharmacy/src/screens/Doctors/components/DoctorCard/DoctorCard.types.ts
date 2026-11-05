import type { DoctorProfile } from "@/utils/calculations/hospital";

export type DoctorCardProps = {
  doctor: DoctorProfile;
  onEdit: (doctor: DoctorProfile) => void;
};
