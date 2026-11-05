import { describe, expect, it } from "vitest";
import { ConsultationTable } from "./ConsultationTable";

describe("ConsultationTable", () => {
  it("exports the component", () => {
    expect(typeof ConsultationTable).toBe("function");
  });
});
