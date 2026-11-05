import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Paywall } from "./Paywall";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    go: () => undefined,
    subscription: { plan: "Essential" },
  }),
}));

describe("Paywall", () => {
  it("explains that the route is a premium feature", () => {
    render(<Paywall route="crm" />);
    expect(
      screen.getByRole("heading", { name: "CRM · Patients is a premium feature" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upgrade to unlock" })).toBeTruthy();
  });
});
