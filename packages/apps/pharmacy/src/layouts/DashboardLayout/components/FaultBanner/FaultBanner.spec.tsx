import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FaultBanner } from "./FaultBanner";

vi.mock("@/hooks", () => ({
  usePharma: function usePharma() {
    return {
      formFault: { field: "gstin", message: "Enter a valid GSTIN" },
      clearFault: function clearFault() {},
    };
  },
}));

describe("FaultBanner", () => {
  it("shows the form fault", () => {
    render(<FaultBanner />);
    expect(screen.getByRole("alert").textContent).toContain("Enter a valid GSTIN");
  });
});
