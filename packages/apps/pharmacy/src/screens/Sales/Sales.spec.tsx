import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SalesScreen from "./Sales";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    sales: [],
    prescriptions: [],
    profile: { name: "Pharmacy" },
    advanceOrder() {},
    cancelOrder() {},
    markPaid() {},
    now: Date.now(),
    go() {},
  }),
}));

describe("SalesScreen", () => {
  it("renders the sales heading", () => {
    render(<SalesScreen />);
    expect(screen.getByText("All sales")).toBeTruthy();
    expect(screen.getByText("No sales in this period / filter.")).toBeTruthy();
  });
});
