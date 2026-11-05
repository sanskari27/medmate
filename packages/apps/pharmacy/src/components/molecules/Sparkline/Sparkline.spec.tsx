import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sparkline } from "./Sparkline";

describe("Sparkline", () => {
  it("draws a line from the series", () => {
    const { container } = render(<Sparkline data={[1, 4, 2]} />);
    const path = container.querySelector("path");
    expect(path?.getAttribute("d")?.startsWith("M ")).toBe(true);
    expect(container.querySelector("[data-slot='sparkline']")).toBeTruthy();
  });
});
