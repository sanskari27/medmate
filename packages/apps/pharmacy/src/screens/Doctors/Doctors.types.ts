import type { DoctorProfile, DoctorStatus } from "@/utils/calculations/hospital";

export type DoctorStatusFilter = "all" | DoctorStatus;

export type DoctorDirectoryFilters = {
  query: string;
  department: string;
  status: DoctorStatusFilter;
};

export type DoctorDraft = Omit<DoctorProfile, "id">;

export type DoctorDirectoryCounts = {
  total: number;
  available: number;
  onLeave: number;
  departments: number;
};
