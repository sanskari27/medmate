import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Inner } from "./Inner";

vi.mock("@/hooks", () => ({
  usePharma: function usePharma() {
    return {
      setupComplete: false,
      signedIn: false,
      needsPin: false,
      pinReset: false,
      route: "dashboard",
      go: function go() {},
      me: null,
      isHospital: false,
    };
  },
}));

vi.mock("@/services/api/apiClient", () => ({
  api: function api() {
    return new Promise(function wait() {});
  },
}));

describe("Inner", () => {
  it("waits for the master session before showing sign in", () => {
    render(<Inner />);
    expect(screen.getByText("Loading pharmacy…")).toBeTruthy();
  });
});
