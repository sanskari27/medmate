import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("renders a button and marks the selected state", () => {
    const view = render(<Chip>All</Chip>);
    const idle = screen.getByRole("button", { name: "All" });
    expect(idle.getAttribute("data-slot")).toBe("chip");
    expect(idle.className.includes("bg-paper")).toBe(true);

    view.rerender(<Chip selected>All</Chip>);
    const selected = screen.getByRole("button", { name: "All" });
    expect(selected.className.includes("border-dark")).toBe(true);
    expect(selected.className.includes("bg-dark")).toBe(true);
    expect(selected.getAttribute("aria-pressed")).toBe("true");
  });
});
