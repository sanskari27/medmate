import { describe, expect, it } from "vitest";
import { IssuesTable } from "./IssuesTable";

describe("IssuesTable", () => {
  it("exports the component", () => {
    expect(typeof IssuesTable).toBe("function");
  });
});
