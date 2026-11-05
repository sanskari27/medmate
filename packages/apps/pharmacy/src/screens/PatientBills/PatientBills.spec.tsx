import { describe, expect, it } from "vitest";
import type { Sale } from "@/utils";
import { billTotal } from "./PatientBills.utils";

describe("PatientBills", () => {
  it("returns zero for a bill with no lines", () => {
    const sale = { items: [], discount: 0 } as unknown as Sale;
    expect(billTotal(sale)).toBe(0);
  });
});
