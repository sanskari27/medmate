import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Canvas } from "./Canvas";

vi.mock("@/hooks", () => ({
  usePharma: function usePharma() {
    return {
      route: "reports",
      featureLocked: function featureLocked() {
        return true;
      },
      go: function go() {},
      subscription: { plan: "Essential" },
    };
  },
}));

describe("Canvas", () => {
  it("shows the paywall when the route is locked", () => {
    render(<Canvas />);
    expect(screen.getByRole("heading", { name: "Reports is a premium feature" })).toBeTruthy();
  });
});
