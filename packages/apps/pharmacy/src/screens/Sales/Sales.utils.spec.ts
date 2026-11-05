import { describe, expect, it } from "vitest";
import type { Sale } from "@/utils";
import { nextSalesSort, selectSales, sortMarker, summarizeSales } from "./Sales.utils";

const sale = {
  id: "INV-1",
  channel: "offline",
  status: "completed",
  customer: { name: "Asha", phone: "999" },
  items: [{ qty: 2, price: 50, mrp: 50, gst: 12 }],
  discount: 0,
  payMode: "cash",
  paid: true,
  createdAt: 100,
} as Sale;

describe("selectSales", () => {
  it("keeps a sale whose customer matches the query", () => {
    const rows = selectSales([sale], blankQuery("asha"), always);
    expect(rows).toHaveLength(1);
    expect(selectSales([sale], blankQuery("nobody"), always)).toHaveLength(0);
  });
});

describe("summarizeSales", () => {
  it("adds the payable total", () => {
    const rows = selectSales([sale], blankQuery(""), always);
    expect(summarizeSales(rows).net).toBe(100);
    expect(summarizeSales(rows).units).toBe(2);
  });
});

describe("nextSalesSort", () => {
  it("flips the direction when the same column is chosen again", () => {
    expect(nextSalesSort("date", "desc", "date").direction).toBe("asc");
    expect(sortMarker(true, "asc")).toBe("▲");
  });
});

function always() {
  return true;
}

function blankQuery(searchQuery: string) {
  return {
    channel: "all" as const,
    payMode: "all" as const,
    status: "all" as const,
    paid: "all" as const,
    searchQuery,
    sort: "date" as const,
    direction: "desc" as const,
  };
}
