import { describe, expect, it } from "vitest";
import { AdmissionsTable } from "./AdmissionsTable";

describe("AdmissionsTable", () => {
  it("exports the component", () => {
    expect(typeof AdmissionsTable).toBe("function");
  });
});
