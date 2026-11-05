import { describe, expect, it } from "vitest";
import { AuditTable } from "./AuditTable";

describe("AuditTable", () => {
  it("exports the component", () => {
    expect(typeof AuditTable).toBe("function");
  });
});
