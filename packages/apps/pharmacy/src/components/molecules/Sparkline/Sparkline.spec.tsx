import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sparkline } from "./Sparkline";

describe("Sparkline", () => {
  it("draws a line from the series", () => {
    const { container } = render(<Sparkline data={[1, 4, 2]} />);
    const paths = container.querySelectorAll("path");
    expect(paths[0]?.getAttribute("d")?.startsWith("M ")).toBe(true);
    expect(paths[1]?.getAttribute("stroke")).toBe("var(--color-mid)");
    expect(paths[0]?.getAttribute("opacity")).toBe("0.12");
    expect(container.querySelector("[data-slot='sparkline']")).toBeTruthy();
  });
});
