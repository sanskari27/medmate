import { describe, expect, it } from "vitest";
import { canOpenReports } from "./model";

describe("report access", () => {
  it("lets the owner and a reader open the page", () => {
    expect(canOpenReports("owner", [])).toBe(true);
    expect(canOpenReports("staff", ["reports:read"])).toBe(true);
    expect(canOpenReports("staff", ["reports:export"])).toBe(false);
    expect(canOpenReports("staff", [])).toBe(false);
  });
});
