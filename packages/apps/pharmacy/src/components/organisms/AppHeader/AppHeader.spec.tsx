import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "./AppHeader";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    route: "dashboard",
    go: () => undefined,
    back: () => undefined,
    canGoBack: false,
    prescriptions: [{ status: "pending" }],
    subscription: { plan: "Essential" },
    me: { role: "Owner", permissions: [] },
  }),
}));

describe("AppHeader", () => {
  it("renders the page title and upgrade chip", () => {
    function onMenu() {
      return undefined;
    }
    render(<AppHeader onMenu={onMenu} />);
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Essential · Upgrade" })).toBeTruthy();
  });
});
