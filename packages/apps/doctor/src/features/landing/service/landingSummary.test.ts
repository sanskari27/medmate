import { describe, expect, it } from "vitest";
import { buildLandingSummary, filterParams, holds, money } from "./landingSummary";
import type { ClinicGrant, ClinicPatient, ClinicRole } from "@/types";

const ALL_GRANTS: ClinicGrant[] = [
  "clinic:patients:read",
  "clinic:patients:read_clinical",
  "clinic:billing:read",
  "clinic:staff:read",
];

const patients: ClinicPatient[] = [
  {
    id: "p1",
    name: "Anjali Menon",
    age: 34,
    sex: "F",
    phone: "••••• 28051",
    status: "waiting",
    due: 500,
    conditions: "Hypertension",
  },
  {
    id: "p2",
    name: "Rahul Sharma",
    age: 45,
    sex: "M",
    phone: "••••• 12345",
    status: "with-doctor",
  },
  {
    id: "p3",
    name: "Meera Nair",
    age: 8,
    sex: "F",
    phone: "••••• 90771",
    status: "seen",
  },
];

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
      const summary = buildLandingSummary(role, patients, ALL_GRANTS);
      expect(summary.title).toMatch(headlines[role]);
    }
  });

  it("shows an amount only to a role that holds the billing grant", () => {
    const withoutBilling = buildLandingSummary("front_desk", patients, ["clinic:patients:read"]);
    expect(withoutBilling.stats.some((stat) => stat.value.includes("₹"))).toBe(false);
    expect(withoutBilling.stats.some((stat) => stat.label === "Amount due")).toBe(false);

    const withBilling = buildLandingSummary("front_desk", patients, ALL_GRANTS);
    const due = withBilling.stats.find((stat) => stat.label === "Amount due");
    expect(due?.value).toBe("₹500");
  });

  it("never shows an amount to a role without the billing grant, whatever the role", () => {
    for (const role of ["doctor", "nurse", "front_desk", "admin", "owner"] as ClinicRole[]) {
      const summary = buildLandingSummary(role, patients, ["clinic:patients:read"]);
      expect(summary.stats.some((stat) => stat.value.includes("₹"))).toBe(false);
    }
  });

  it("counts each patient status", () => {
    const summary = buildLandingSummary("doctor", patients, ALL_GRANTS);
    const value = (label: string) => summary.stats.find((stat) => stat.label === label)?.value;
    expect(value("Waiting")).toBe("1");
    expect(value("With doctor")).toBe("1");
    expect(value("Seen")).toBe("1");
  });

  it("links each stat to the patient list with the matching filter", () => {
    const summary = buildLandingSummary("doctor", patients, ALL_GRANTS);
    const waiting = summary.stats.find((stat) => stat.label === "Waiting");
    expect(filterParams(waiting?.filter ?? {})).toEqual({ status: "waiting" });
  });

  it("handles a clinic with no patients", () => {
    const summary = buildLandingSummary("admin", [], ALL_GRANTS);
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
