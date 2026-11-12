import { describe, expect, it } from "vitest";
import { SAMPLE_LINES, computeInvoice, formatInr, formatInr2 } from "./invoice";

describe("computeInvoice", () => {
  it("backs GST out of the sample lines", () => {
    const totals = computeInvoice(SAMPLE_LINES);
    expect(formatInr2(totals.gross)).toBe("₹63.00");
    expect(totals.payable).toBe(63);
    expect(formatInr(totals.payable)).toBe("₹63");
    expect(totals.lines.map((line) => line.gst)).toEqual([5, 12]);
  });
});
