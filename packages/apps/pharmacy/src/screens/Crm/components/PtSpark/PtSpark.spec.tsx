import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PtSpark } from "./PtSpark";

describe("PtSpark", () => {
  it("draws a sparkline when there are two points", () => {
    const view = render(<PtSpark data={[1, 3, 2]} />);
    expect(view.container.querySelector("[data-slot='sparkline']")).toBeTruthy();
  });

  it("renders nothing for a single point", () => {
    const view = render(<PtSpark data={[4]} />);
    expect(view.container.querySelector("[data-slot='sparkline']")).toBeNull();
  });
});
