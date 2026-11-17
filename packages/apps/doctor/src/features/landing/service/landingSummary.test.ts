import { describe, expect, it } from "vitest";
import { buildLandingSummary, holds, money } from "./landingSummary";
import type { ClinicGrant, ClinicRole } from "@/types";

const ALL_GRANTS: ClinicGrant[] = [
  "clinic:patients:read",
  "clinic:patients:read_clinical",
  "clinic:billing:read",
  "clinic:staff:read",
];

const counts = {
  totalPatients: 4,
  waitingCount: 1,
  withDoctorCount: 1,
  seenCount: 1,
  amountDue: 750,
};

describe("landing summary", () => {
  it("gives each role its own headline", () => {
    const headlines: Record<ClinicRole, RegExp> = {
      doctor: /your patients/i,
      nurse: /needing you/i,
      front_desk: /at the desk/i,
      admin: /clinic today/i,
      owner: /clinic today/i,
    };
    for (const role of Object.keys(headlines) as ClinicRole[]) {
      const summary = buildLandingSummary(role, counts, ALL_GRANTS);
      expect(summary.title).toMatch(headlines[role]);
    }
  });

  it("shows an amount only to a role that holds the billing grant", () => {
    const withoutBilling = buildLandingSummary("front_desk", counts, ["clinic:patients:read"]);
    expect(withoutBilling.stats.some((stat) => stat.value.includes("₹"))).toBe(false);
    expect(withoutBilling.stats.some((stat) => stat.label === "Amount due")).toBe(false);

    const withBilling = buildLandingSummary("front_desk", counts, ALL_GRANTS);
    const due = withBilling.stats.find((stat) => stat.label === "Amount due");
    expect(due?.value).toBe("₹750");
  });

  it("never shows an amount to a role without the billing grant, whatever the role", () => {
    for (const role of ["doctor", "nurse", "front_desk", "admin", "owner"] as ClinicRole[]) {
      const summary = buildLandingSummary(role, counts, ["clinic:patients:read"]);
      expect(summary.stats.some((stat) => stat.value.includes("₹"))).toBe(false);
    }
  });

  it("counts each patient status", () => {
    const summary = buildLandingSummary("doctor", counts, ALL_GRANTS);
    const value = (label: string) => summary.stats.find((stat) => stat.label === label)?.value;
    expect(value("Waiting")).toBe("1");
    expect(value("With doctor")).toBe("1");
    expect(value("Seen")).toBe("1");
    expect(value("Patients")).toBe("4");
  });

  it("links each stat to the patient list with the matching filter", () => {
    const summary = buildLandingSummary("doctor", counts, ALL_GRANTS);
    const waiting = summary.stats.find((stat) => stat.label === "Waiting");
    expect(waiting?.filter).toEqual({ status: "waiting" });
    const amount = summary.stats.find((stat) => stat.label === "Amount due");
    expect(amount?.filter).toEqual({ due: true });
  });

  it("handles a clinic with no patients", () => {
    const summary = buildLandingSummary(
      "admin",
      { totalPatients: 0, waitingCount: 0, withDoctorCount: 0, seenCount: 0, amountDue: 0 },
      ALL_GRANTS,
    );
    expect(summary.stats.every((stat) => stat.value === "0" || stat.value === "₹0")).toBe(true);
  });

  it("reads grants defensively", () => {
    expect(holds(undefined, "clinic:billing:read")).toBe(false);
    expect(holds([], "clinic:billing:read")).toBe(false);
    expect(holds(ALL_GRANTS, "clinic:billing:read")).toBe(true);
  });

  it("formats money the way the clinic does", () => {
    expect(money(500)).toBe("₹500");
    expect(money(123456)).toBe("₹1,23,456");
    expect(money(undefined)).toBe("₹0");
  });
});
