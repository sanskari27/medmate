import { describe, expect, it } from "vitest";
import { visibleIndents } from "./Indents.utils";

describe("visibleIndents", () => {
  it("filters by status and sorts newest first", () => {
    const rows = [
      { status: "pending", at: 1 },
      { status: "issued", at: 3 },
      { status: "pending", at: 2 },
    ];
    expect(visibleIndents(rows, "pending")).toEqual([
      { status: "pending", at: 2 },
      { status: "pending", at: 1 },
    ]);
  });
});
