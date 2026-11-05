import { describe, expect, it } from "vitest";
import { preferredSupplyCount } from "./Suppliers.utils";

describe("preferredSupplyCount", () => {
  it("counts rows marked preferred", () => {
    expect(preferredSupplyCount([{ preferred: true }, { preferred: false }, {}])).toBe(1);
  });
});
