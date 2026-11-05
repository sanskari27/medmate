import { describe, expect, it } from "vitest";
import { ReportHub } from "./ReportHub";

describe("ReportHub", () => {
  it("exports the component", () => {
    expect(typeof ReportHub).toBe("function");
  });
});
