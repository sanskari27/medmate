import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    prescriptions: [],
    inventory: [],
    now: 0,
    approveRx: vi.fn(),
    rejectRx: vi.fn(),
    dispenseRx: vi.fn(),
  }),
}));

import PrescriptionsScreen from "./Prescriptions";

describe("Prescriptions", () => {
  it("renders the empty queue", () => {
    render(<PrescriptionsScreen />);
    expect(screen.getByText("Nothing here")).toBeTruthy();
    expect(screen.getByText("No prescriptions match this view.")).toBeTruthy();
  });
});
