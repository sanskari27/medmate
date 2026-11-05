import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrdersScreen from "./Orders";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    sales: [],
    prescriptions: [],
    profile: { name: "Pharmacy" },
    advanceOrder() {},
    cancelOrder() {},
    markPaid() {},
    now: 0,
    go() {},
  }),
}));

describe("OrdersScreen", () => {
  it("renders the empty order list", () => {
    render(<OrdersScreen />);
    expect(screen.getByText("No orders in this view.")).toBeTruthy();
  });
});
