import { describe, expect, it } from "vitest";
import { Table } from "./Table";

describe("Table", () => {
  it("exports the component", () => {
    expect(typeof Table).toBe("function");
  });
});
