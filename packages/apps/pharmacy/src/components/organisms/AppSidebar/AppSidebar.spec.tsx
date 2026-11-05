import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "./AppSidebar";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    route: "dashboard",
    go: () => undefined,
    profile: { name: "Sri Sai Medicals", pharmacist: "Anita Rao, B.Pharm", storeOpen: true },
    prescriptions: [],
    sales: [],
    isHospital: false,
    wardIndents: [],
    signOut: () => undefined,
    featureLocked: () => false,
    me: { role: "Owner", permissions: [] },
  }),
}));

describe("AppSidebar", () => {
  it("renders the store name and a nav destination", () => {
    function onNavigate() {
      return undefined;
    }
    render(<AppSidebar open onNavigate={onNavigate} />);
    expect(screen.getByText("Sri Sai Medicals")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dashboard" })).toBeTruthy();
  });
});
