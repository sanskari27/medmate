import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthLayout } from "./AuthLayout";

describe("AuthLayout", () => {
  it("passes auth screens through a stack wrapper", () => {
    render(<AuthLayout>Partner sign in</AuthLayout>);
    expect(screen.getByText("Partner sign in")).toBeTruthy();
    expect(document.querySelector("[data-slot='stack']")?.className).toContain("contents");
  });
});
