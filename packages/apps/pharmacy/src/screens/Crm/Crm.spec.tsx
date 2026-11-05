import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    sales: [],
    inventory: [],
    creditPayments: [],
    crm: { meta: {}, campaigns: [], feedbacks: [], reminders: [], redemptions: [] },
    profile: { name: "Green Cross", phone: "", address: "", city: "", state: "" },
    now: 0,
    setPatientMeta: vi.fn(),
    addCampaign: vi.fn(),
    addFeedback: vi.fn(),
    logReminder: vi.fn(),
    redeemPoints: vi.fn(),
    go: vi.fn(),
  }),
}));

import CrmScreen from "./Crm";

describe("Crm", () => {
  it("renders the overview", () => {
    render(<CrmScreen />);
    expect(screen.getByRole("button", { name: "Overview" })).toBeTruthy();
    expect(screen.getByText("No at-risk patients — great retention!")).toBeTruthy();
  });
});
