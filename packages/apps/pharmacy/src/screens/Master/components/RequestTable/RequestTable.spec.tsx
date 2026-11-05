import { describe, expect, it } from "vitest";
import { RequestTable } from "./RequestTable";

describe("RequestTable", () => {
  it("exports the component", () => {
    expect(typeof RequestTable).toBe("function");
  });
});
