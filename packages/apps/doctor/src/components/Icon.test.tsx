import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import icons from "@/assets/icons.json";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("renders svg with class i, viewBox, aria-hidden", () => {
    const { container } = render(<Icon name="queue" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("class")).toBe("i");
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders path data from icons.json", () => {
    const { container } = render(<Icon name="queue" />);
    const svg = container.querySelector("svg")!;
    const expected = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    expected.innerHTML = icons.queue;
    expect(svg.innerHTML).toBe(expected.innerHTML);
  });

  it("renders empty svg for unknown icon without throwing", () => {
    const { container } = render(<Icon name={"nope" as keyof typeof icons} />);
    const svg = container.querySelector("svg")!;
    expect(svg.innerHTML).toBe("");
  });
});
