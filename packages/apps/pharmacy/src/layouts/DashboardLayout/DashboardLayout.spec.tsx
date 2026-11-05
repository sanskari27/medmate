import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardLayout } from "./DashboardLayout";

vi.mock("@/app/providers/PharmaProvider", () => ({
  PharmaProvider: function PharmaProvider(props: { children: ReactNode }) {
    return props.children;
  },
}));

vi.mock("./components/Frame", () => ({
  Frame: function Frame() {
    return "Pharmacy frame";
  },
}));

describe("DashboardLayout", () => {
  it("renders the pharmacy frame inside the provider", () => {
    render(<DashboardLayout />);
    expect(screen.getByText("Pharmacy frame")).toBeTruthy();
  });
});
