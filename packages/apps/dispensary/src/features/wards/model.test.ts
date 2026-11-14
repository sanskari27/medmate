import { describe, expect, it } from "vitest";
import {
  bedLabels,
  daysIn,
  freeBeds,
  heldLabels,
  occupancy,
  type Admission,
  type Ward,
} from "./model";

const ward: Ward = {
  id: "w1",
  name: "Orthopaedic Ward",
  code: "ORT",
  floor: "3rd floor",
  category: "Surgical",
  beds: 4,
  sister: "Sr. Meena",
  dailyRate: "1000.00",
  bedsHeld: 1,
  underMaintenance: false,
  maintenanceNote: null,
};

const admission: Admission = {
  id: "a1",
  name: "Asha Rao",
  uhid: "UHID-1",
  phone: null,
  age: 42,
  gender: "Female",
  wardId: "w1",
  wardName: "Orthopaedic Ward",
  bed: "ORT-1",
  doctor: null,
  diagnosis: null,
  payerType: "self",
  insurer: null,
  policyNo: null,
  admittedAt: "2026-11-14T00:00:00Z",
  status: "admitted",
  days: 1,
  dailyRate: "1000.00",
  outstanding: "1000.00",
};

describe("ward bed map", () => {
  it("numbers beds from the code and holds the last labels", () => {
    expect(bedLabels("ORT", 4)).toEqual(["ORT-1", "ORT-2", "ORT-3", "ORT-4"]);
    expect(heldLabels("ORT", 4, 1)).toEqual(["ORT-4"]);
    expect(freeBeds(ward, [admission])).toEqual(["ORT-2", "ORT-3"]);
  });

  it("counts assignable free beds and at least one day", () => {
    expect(occupancy([ward], [admission])).toEqual({ beds: 4, occ: 1, free: 2, pct: 25 });
    const admitted = Date.parse("2026-11-14T00:00:00Z");
    expect(daysIn("2026-11-14T00:00:00Z", admitted)).toBe(1);
    expect(daysIn("2026-11-14T00:00:00Z", admitted + 86_400_001)).toBe(2);
  });
});
