import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SalesRegisterScreen from "./SalesRegister";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    sales: [],
    profile: { name: "Pharmacy" },
    now: Date.now(),
  }),
}));

describe("SalesRegisterScreen", () => {
  it("renders the source chips and empty table", () => {
    render(<SalesRegisterScreen />);
    expect(screen.getByRole("button", { name: "All sources" })).toBeTruthy();
    expect(screen.getByText("No sales match these filters.")).toBeTruthy();
  });
});
