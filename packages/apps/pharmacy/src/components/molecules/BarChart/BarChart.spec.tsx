import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarChart } from "./BarChart";

describe("BarChart", () => {
  it("draws a labelled stacked column", () => {
    const { container } = render(
      <BarChart
        columns={[
          {
            label: "Mon",
            segments: [
              { value: 2, tone: "on" },
              { value: 1, tone: "off" },
            ],
          },
        ]}
      />,
    );
    expect(container.querySelector("[data-slot='bar-chart']")).toBeTruthy();
    expect(container.querySelector("text")?.textContent).toBe("Mon");
    expect(container.querySelectorAll("rect").length).toBeGreaterThan(0);
  });
});
