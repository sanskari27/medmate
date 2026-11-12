import { describe, expect, it } from "vitest";
import { code128Bars, code128Bits } from "./barcode";

describe("Code 128 barcode", () => {
  it("encodes an employee code with a start pattern, checksum, and quiet zone", () => {
    const bits = code128Bits("EMP-001");
    expect(bits.startsWith("11010010000")).toBe(true);
    expect(bits).toHaveLength(112);
    const bars = code128Bars("EMP-001");
    expect(bars[0]?.x).toBe(10);
    expect(bars[0]?.total).toBe(132);
    expect(bars.at(-1)?.x).toBeGreaterThan(100);
  });
});
