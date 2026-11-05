import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SupportBanner } from "./SupportBanner";

vi.mock("@/hooks", () => ({
  usePharma: function usePharma() {
    return {
      impersonator: "ops@medmate",
      profile: { name: "Sri Sai Medicals" },
      signOut: function signOut() {},
    };
  },
}));

describe("SupportBanner", () => {
  it("shows the support session", () => {
    render(<SupportBanner />);
    expect(screen.getByRole("status").textContent).toContain(
      "Support · Sri Sai Medicals · ops@medmate",
    );
  });
});
