import { describe, expect, it } from "vitest";
import type { Sale } from "@/utils";
import { filterOrders, orderCounts, orderPayable, packRailTone, packStepOf } from "./Orders.utils";

const sale = {
  id: "INV-1",
  channel: "online",
  status: "new",
  customer: { name: "Asha", phone: "999" },
  items: [{ qty: 1, price: 40, mrp: 40, gst: 5 }],
  discount: 0,
  payMode: "cod",
  paid: false,
  createdAt: 5,
} as Sale;

describe("filterOrders", () => {
  it("keeps an online order that matches the customer", () => {
    expect(filterOrders([sale], "online", "asha")).toEqual([sale]);
    expect(filterOrders([sale], "offline", "")).toEqual([]);
    expect(orderCounts([sale]).action).toBe(1);
    expect(orderPayable(sale)).toBe(40);
  });
});

describe("packStepOf", () => {
  it("maps packed orders to the handover step", () => {
    expect(packStepOf("packed")).toBe("handover");
    expect(packRailTone("handover", "pack")).toBe("done");
  });
});
