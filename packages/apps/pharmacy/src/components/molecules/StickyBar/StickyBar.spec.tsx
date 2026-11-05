import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StickyBar } from "./StickyBar";

describe("StickyBar", () => {
  it("sticks a toolbar row", () => {
    const { container } = render(<StickyBar>Filters</StickyBar>);
    const bar = container.querySelector("[data-slot='sticky-bar']");
    expect(bar?.textContent).toBe("Filters");
    expect(bar?.className.includes("sticky")).toBe(true);
  });
});
