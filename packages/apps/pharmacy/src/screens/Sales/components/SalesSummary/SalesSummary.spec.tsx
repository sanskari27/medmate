import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SalesSummary } from "./SalesSummary";

describe("SalesSummary", () => {
  it("renders the bill count", () => {
    render(
      <SalesSummary periodLabel="Last 365 days" bills={3} units={8} gross="₹1" tax="₹0" net="₹1" />,
    );
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("Net collected")).toBeTruthy();
  });
});
