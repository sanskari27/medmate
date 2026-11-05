import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  it("draws the partner mark", () => {
    const { container } = render(<BrandMark />);
    expect(container.querySelector("[data-slot='brand-mark'] svg")).toBeTruthy();
  });
});
