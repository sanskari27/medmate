import { describe, expect, it } from "vitest";
import type { Patient } from "@/utils/calculations/crm";
import { availablePoints, campaignMessage, clampNps, filterPatients, patientMetaFromForm } from "./Crm.utils";
import type { PatientProfileForm } from "./Crm.types";

function patient(patch: Partial<Patient>): Patient {
  return {
    key: "asha",
    name: "Asha Rao",
    phone: "999",
    orders: 1,
    spent: 100,
    units: 1,
    firstAt: 1,
    lastAt: 1,
    online: false,
    onlineOrders: 0,
    rx: false,
    categories: [],
    chronic: false,
    points: 40,
    tier: "Silver",
    avgOrder: 100,
    medicines: [],
    payModes: [],
    rfm: { r: 1, f: 1, m: 1, score: 3 },
    segments: ["chronic"],
    churnRisk: false,
    daysSince: 1,
    ...patch,
  };
}

describe("crm helpers", () => {
  it("filters patients and subtracts redeemed points", () => {
    const rows = [patient({}), patient({ key: "bala", name: "Bala", phone: "111", segments: [] })];
    expect(filterPatients(rows, "chronic", "asha")).toHaveLength(1);
    expect(availablePoints(rows[0], new Map([["asha", 10]]))).toBe(30);
  });

  it("builds the default campaign message and clamps NPS", () => {
    expect(campaignMessage("Green Cross", "10% off", "")).toContain("10% off");
    expect(campaignMessage("Green Cross", "", "Custom")).toBe("Custom");
    expect(clampNps("12")).toBe(10);
    expect(clampNps("")).toBe(0);
  });

  it("turns the profile form into patient meta", () => {
    const form: PatientProfileForm = {
      age: "42",
      gender: "Female",
      bloodGroup: "O+",
      dob: "1984-01-01",
      address: " MG Road ",
      conditions: "Diabetes, Hypertension",
      allergies: "",
      note: " note ",
      consent: true,
    };
    expect(patientMetaFromForm(form).conditions).toEqual(["Diabetes", "Hypertension"]);
    expect(patientMetaFromForm(form).address).toBe("MG Road");
  });
});
