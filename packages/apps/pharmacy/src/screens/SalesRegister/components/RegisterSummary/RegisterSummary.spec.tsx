import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RegisterSummary } from "./RegisterSummary";

describe("RegisterSummary", () => {
  it("renders the revenue chip", () => {
    render(<RegisterSummary count={1} revenue="₹80" paid="₹0" unpaid="₹80" insurance="₹0" />);
    expect(screen.getByText("Revenue")).toBeTruthy();
    expect(screen.getAllByText("₹80").length).toBeGreaterThan(0);
  });
});
