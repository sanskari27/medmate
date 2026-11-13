import { describe, expect, it } from "vitest";
import { filterSales, refundAmount, type SaleRow } from "./model";

const line = (position: number, qty: number, unitPrice: string, returnedQty = 0) => ({
  position,
  qty,
  unitPrice,
  returnedQty,
});

describe("sale refund", () => {
  it("gives the extra paisa to the earliest units and the remainder to the last line", () => {
    expect(refundAmount([line(0, 3, "4.00")], "2.00", [{ position: 0, qty: 1 }])).toBe("3.34");
    expect(refundAmount([line(0, 3, "4.00", 1)], "2.00", [{ position: 0, qty: 2 }])).toBe("6.66");
    expect(
      refundAmount([line(0, 3, "10.00"), line(1, 1, "20.00")], "5.00", [
        { position: 0, qty: 3 },
        { position: 1, qty: 1 },
      ]),
    ).toBe("45.00");
    expect(refundAmount([line(0, 2, "0.00")], "1.00", [{ position: 0, qty: 2 }])).toBe("0.00");
  });
});

const rows: SaleRow[] = [
  {
    id: "INV-0001",
    type: "sale",
    invoiceNumber: "INV-0001",
    patientName: "Ada",
    recordedAt: "2026-11-12T05:00:00Z",
    items: 2,
    amount: "72.00",
  },
  {
    id: "RET-001",
    type: "return",
    invoiceNumber: "INV-0001",
    patientName: "Bea",
    recordedAt: "2026-11-12T06:00:00Z",
    items: 1,
    amount: "24.00",
  },
];

describe("sale search", () => {
  it("matches invoice, patient, return number, and type", () => {
    expect(filterSales(rows, "  ").map((row) => row.id)).toEqual(["INV-0001", "RET-001"]);
    expect(filterSales(rows, "inv-0001").map((row) => row.id)).toEqual(["INV-0001", "RET-001"]);
    expect(filterSales(rows, "bea").map((row) => row.id)).toEqual(["RET-001"]);
    expect(filterSales(rows, "RET-001").map((row) => row.id)).toEqual(["RET-001"]);
    expect(filterSales(rows, "sale").map((row) => row.id)).toEqual(["INV-0001"]);
    expect(filterSales(rows, "nobody")).toEqual([]);
    expect(
      filterSales([{ ...rows[0], patientPhone: "9886012345" }], "9886012345").map((row) => row.id),
    ).toEqual(["INV-0001"]);
  });
});
