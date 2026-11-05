import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Toast } from "./Toast";

vi.mock("@/hooks", () => ({
  usePharma: () => ({ toastMsg: "Bill saved" }),
}));

describe("Toast", () => {
  it("shows the pharmacy toast message", () => {
    render(<Toast />);
    expect(screen.getByRole("status").textContent).toContain("Bill saved");
  });
});
