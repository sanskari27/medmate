import { describe, expect, it } from "vitest";
import type { PatientRow } from "./model";
import { collectHref, exportCsv } from "./patientsView";

const ada: PatientRow = {
  phone: "9886012345",
  name: "Ada",
  orders: 2,
  spent: "250.00",
  units: 3,
  lastAt: "2026-11-13T09:00:00Z",
  rx: false,
  points: 2,
  tier: "New",
  segments: ["regular"],
  creditOutstanding: "24.00",
  daysSince: 0,
};

describe("patient export", () => {
  it("builds a csv row and a collect link", () => {
    expect(exportCsv([ada])).toContain("Ada,9886012345,2,3,250.00,2");
    const link = collectHref(ada.phone, ada.name, ada.creditOutstanding);
    expect(link.startsWith("https://wa.me/919886012345?text=")).toBe(true);
    expect(decodeURIComponent(link)).toContain("Ada");
    expect(decodeURIComponent(link)).toContain("₹24.00");
  });
});
