import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartLegend } from "./ChartLegend";

describe("ChartLegend", () => {
  it("labels each series", () => {
    render(
      <ChartLegend
        items={[
          { label: "Online", tone: "on" },
          { label: "Counter", tone: "off" },
        ]}
      />,
    );
    expect(screen.getByText("Online")).toBeTruthy();
    expect(screen.getByText("Counter")).toBeTruthy();
  });
});
