import { describe, expect, it } from "vitest";
import type { DoctorProfile } from "@/utils/calculations/hospital";
import { countDoctors, doctorDraftIsValid, filterDoctors } from "./Doctors.utils";
import type { DoctorDraft } from "./Doctors.types";

function doctor(overrides: Partial<DoctorProfile> = {}): DoctorProfile {
  return {
    id: "doc-1",
    name: "Dr. Meera Nair",
    gender: "Female",
    qualification: "MBBS, MD",
    specialty: "Cardiologist",
    department: "Cardiology",
    regNo: "KMC-12345",
    experience: 8,
    phone: "+91 90000 00000",
    email: "meera@hospital.in",
    opdRoom: "OPD-1",
    days: "Mon–Sat",
    timing: "10:00 AM – 1:00 PM",
    fee: 500,
    languages: "English, Hindi",
    status: "active",
    bio: "Heart clinic",
    ...overrides,
  };
}

const draft = doctor() as DoctorDraft;

describe("filterDoctors", () => {
  const doctors = [
    doctor(),
    doctor({
      id: "doc-2",
      name: "Dr. Arun Shah",
      department: "OPD",
      status: "on-leave",
      specialty: "Physician",
      regNo: "MMC-9",
    }),
  ];

  it("keeps every doctor when filters are open", () => {
    expect(filterDoctors(doctors, { query: "", department: "all", status: "all" })).toHaveLength(2);
  });

  it("matches name, specialty, department, registration, and qualification", () => {
    expect(filterDoctors(doctors, { query: "kmc-123", department: "all", status: "all" })).toEqual([
      doctors[0],
    ]);
  });

  it("filters by department and status together", () => {
    expect(filterDoctors(doctors, { query: "", department: "OPD", status: "on-leave" })).toEqual([
      doctors[1],
    ]);
  });
});

describe("countDoctors", () => {
  it("counts availability and distinct departments", () => {
    expect(
      countDoctors([
        doctor(),
        doctor({ id: "doc-2", status: "on-leave", department: "OPD" }),
        doctor({ id: "doc-3", status: "visiting", department: "Cardiology" }),
      ]),
    ).toEqual({ total: 3, available: 1, onLeave: 1, departments: 2 });
  });
});

describe("doctorDraftIsValid", () => {
  it("requires a non-blank name", () => {
    expect(doctorDraftIsValid(draft)).toBe(true);
    expect(doctorDraftIsValid({ ...draft, name: "   " })).toBe(false);
  });
});
