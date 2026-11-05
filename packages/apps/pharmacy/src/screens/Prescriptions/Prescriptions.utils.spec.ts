import { describe, expect, it } from "vitest";
import type { Prescription } from "@/utils";
import { digitalSharePercent, filterPrescriptions, slaOnTimePercent } from "./Prescriptions.utils";

function prescription(patch: Partial<Prescription>): Prescription {
  return {
    id: "RX-1",
    patient: "Asha",
    phone: "999",
    doctor: "Dr Rao",
    uploadedAt: 10,
    channel: "offline",
    status: "pending",
    items: [],
    kind: "digital",
    ...patch,
  };
}

describe("prescription queue helpers", () => {
  it("filters by status, source, and search", () => {
    const rows = [
      prescription({ id: "RX-1", patient: "Asha" }),
      prescription({ id: "RX-2", patient: "Bala", status: "approved", kind: "uploaded", uploadedAt: 20 }),
    ];
    expect(filterPrescriptions(rows, "approved", "uploaded", "bala").map(function id(row) { return row.id; })).toEqual(["RX-2"]);
  });

  it("puts urgent prescriptions first", () => {
    const rows = [
      prescription({ id: "RX-1", uploadedAt: 30 }),
      prescription({ id: "RX-2", uploadedAt: 10, urgent: true }),
    ];
    expect(filterPrescriptions(rows, "all", "all", "")[0]?.id).toBe("RX-2");
  });

  it("computes digital share and SLA", () => {
    expect(digitalSharePercent(1, 4)).toBe(25);
    expect(digitalSharePercent(0, 0)).toBe(0);
    expect(slaOnTimePercent(4, 1)).toBe(75);
    expect(slaOnTimePercent(0, 0)).toBe(100);
  });
});
