import { describe, expect, it } from "vitest";
import {
  blankDraft,
  canOpenDoctors,
  draftIsValid,
  filterDoctors,
  type Doctor,
  type DoctorDraft,
} from "./model";

const doctor = {
  id: "doc-1",
  code: "DR-ANU",
  firstName: "Anu",
  lastName: "Rao",
  displayName: "Dr Anu Rao",
  gender: "female",
  status: "active",
  registrationNumber: "KMC-1",
  registrationCouncil: null,
  registrationState: null,
  qualification: "MBBS",
  specialization: "General medicine",
  subSpecialization: null,
  yearsExperience: null,
  primaryMobile: "+919886011111",
  alternateMobile: null,
  email: null,
  whatsapp: null,
  relationshipStatus: "visiting",
  notes: null,
  workplaceName: "City Hospital",
  workplaceType: null,
  address: null,
  city: "Bengaluru",
  state: "Karnataka",
  pinCode: "560001",
  workplacePhone: null,
  photo: null,
  windows: [],
  documents: [],
  department: null,
} satisfies Doctor;

function filled(overrides: Partial<DoctorDraft> = {}): DoctorDraft {
  return {
    ...blankDraft(),
    code: "DR-ANU",
    firstName: "Anu",
    lastName: "Rao",
    displayName: "Dr Anu Rao",
    gender: "female",
    primaryMobile: "9886011111",
    registrationNumber: "KMC-1",
    qualification: "MBBS",
    specialization: "General medicine",
    workplaceName: "City Hospital",
    city: "Bengaluru",
    state: "Karnataka",
    pinCode: "560001",
    ...overrides,
  };
}

describe("doctor draft", () => {
  it("starts active with one offline window and refuses an empty form", () => {
    const draft = blankDraft();
    expect(draft.status).toBe("active");
    expect(draft.windows[0]).toMatchObject({
      type: "offline",
      days: ["monday"],
      start: "09:00",
      end: "13:00",
      fee: "0",
    });
    expect(draftIsValid(draft)).toBe(false);
    expect(draftIsValid(filled())).toBe(true);
    expect(draftIsValid(filled({ windows: [] }))).toBe(false);
  });
});

describe("doctor search", () => {
  it("matches name, code, mobile, and specialization", () => {
    const rows = [
      doctor,
      {
        ...doctor,
        id: "doc-2",
        code: "DR-RAVI",
        firstName: "Ravi",
        lastName: "Nair",
        displayName: "Dr Ravi",
        primaryMobile: "+919886022222",
        specialization: "Surgery",
        status: "inactive" as const,
      },
    ];
    expect(filterDoctors(rows, { query: "anu", status: "all" })).toHaveLength(1);
    expect(filterDoctors(rows, { query: "9886011111", status: "all" })).toHaveLength(1);
    expect(filterDoctors(rows, { query: "medicine", status: "active" })).toHaveLength(1);
    expect(filterDoctors(rows, { query: "", status: "inactive" }).map((row) => row.code)).toEqual([
      "DR-RAVI",
    ]);
  });
});

describe("doctor menu", () => {
  it("opens only for a hospital owner or a hospital reader", () => {
    expect(canOpenDoctors("owner", [], "hospital")).toBe(true);
    expect(canOpenDoctors("owner", [], "pharmacy")).toBe(false);
    expect(canOpenDoctors("staff", ["doctors:read"], "hospital")).toBe(true);
    expect(canOpenDoctors("staff", ["doctors:update"], "hospital")).toBe(false);
  });
});
