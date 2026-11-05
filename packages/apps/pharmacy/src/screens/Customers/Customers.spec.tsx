import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    sales: [],
    creditPayments: [],
    recordCreditPayment: vi.fn(),
    now: 0,
    go: vi.fn(),
    profile: { name: "Green Cross" },
  }),
}));

import CustomersScreen from "./Customers";

describe("Customers", () => {
  it("renders the customer directory", () => {
    render(<CustomersScreen />);
    expect(screen.getByRole("button", { name: "Excel" })).toBeTruthy();
    expect(screen.getByText("No customers match.")).toBeTruthy();
  });
});
