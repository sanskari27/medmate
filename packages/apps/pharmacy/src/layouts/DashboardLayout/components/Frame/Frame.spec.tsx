import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Frame } from "./Frame";

vi.mock("@/hooks", () => ({
  usePharma: function usePharma() {
    return {
      formFault: null,
      clearFault: function clearFault() {},
      toastMsg: "",
      impersonator: null,
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

describe("Frame", () => {
  it("keeps the fault hook and shows the boot state", () => {
    render(<Frame />);
    expect(document.querySelector("[data-slot='app-frame']")?.getAttribute("data-fault")).toBe("");
    expect(screen.getByText("Loading pharmacy…")).toBeTruthy();
  });
});
