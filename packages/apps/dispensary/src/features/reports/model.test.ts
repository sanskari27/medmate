import { describe, expect, it } from "vitest";
import { canExportReports, canOpenReports, reportRange } from "./model";

describe("report access", () => {
  it("lets the owner and a reader open the page", () => {
    expect(canOpenReports("owner", [])).toBe(true);
    expect(canOpenReports("staff", ["reports:read"])).toBe(true);
    expect(canOpenReports("staff", ["reports:export"])).toBe(false);
    expect(canOpenReports("staff", [])).toBe(false);
  });

  it("lets the owner and an exporter download", () => {
    expect(canExportReports("owner", [])).toBe(true);
    expect(canExportReports("staff", ["reports:export"])).toBe(true);
    expect(canExportReports("staff", ["reports:read"])).toBe(false);
  });

  it("uses the current month, the fiscal year, and custom dates", () => {
    expect(reportRange("month", "2026-11-13")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(reportRange("fy", "2026-11-13")).toEqual({ from: "2026-04-01", to: "2027-03-31" });
    expect(reportRange("fy", "2026-02-01")).toEqual({ from: "2025-04-01", to: "2026-03-31" });
    expect(reportRange("prev-year", "2026-11-13")).toEqual({
      from: "2025-01-01",
      to: "2025-12-31",
    });
    expect(reportRange("prev-fy", "2026-11-13")).toEqual({ from: "2025-04-01", to: "2026-03-31" });
    expect(reportRange("prev-fy", "2026-02-01")).toEqual({ from: "2024-04-01", to: "2025-03-31" });
    expect(reportRange("custom", "2026-11-13", "2026-01-01", "2026-01-31")).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
    expect(reportRange("custom", "2026-11-13")).toBeNull();
  });
});
