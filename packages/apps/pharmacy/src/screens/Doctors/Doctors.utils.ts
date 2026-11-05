import type { DoctorProfile } from "@/utils/calculations/hospital";
import type { DoctorDirectoryCounts, DoctorDirectoryFilters, DoctorDraft } from "./Doctors.types";

const STATUS_TONE = {
  green: "green",
  rose: "rose",
  blue: "blue",
} as const;

export function doctorStatusTone(tone: string) {
  if (tone === "green" || tone === "rose" || tone === "blue") return STATUS_TONE[tone];
  return "gray" as const;
}

export function filterDoctors(doctors: DoctorProfile[], filters: DoctorDirectoryFilters): DoctorProfile[] {
  const needle = filters.query.trim().toLowerCase();
  return doctors.filter(function matchDoctor(doctor) {
    if (filters.department !== "all" && doctor.department !== filters.department) return false;
    if (filters.status !== "all" && doctor.status !== filters.status) return false;
    if (!needle) return true;
    const haystack = `${doctor.name} ${doctor.specialty} ${doctor.department} ${doctor.regNo} ${doctor.qualification}`.toLowerCase();
    return haystack.includes(needle);
  });
}

export function countDoctors(doctors: DoctorProfile[]): DoctorDirectoryCounts {
  let available = 0;
  let onLeave = 0;
  const departments = new Set<string>();
  for (const doctor of doctors) {
    if (doctor.status === "active") available += 1;
    if (doctor.status === "on-leave") onLeave += 1;
    departments.add(doctor.department);
  }
  return { total: doctors.length, available, onLeave, departments: departments.size };
}

export function doctorDraftIsValid(draft: DoctorDraft): boolean {
  return draft.name.trim().length > 0;
}

export function readImageFile(file: File, onLoad: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = function handleLoad() {
    if (typeof reader.result === "string") onLoad(reader.result);
  };
  reader.readAsDataURL(file);
}
