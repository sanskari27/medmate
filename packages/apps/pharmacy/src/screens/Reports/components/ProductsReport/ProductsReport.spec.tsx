import { describe, expect, it } from "vitest";
import { ProductsReport } from "./ProductsReport";

describe("ProductsReport", () => {
  it("exports the component", () => {
    expect(typeof ProductsReport).toBe("function");
  });
});
