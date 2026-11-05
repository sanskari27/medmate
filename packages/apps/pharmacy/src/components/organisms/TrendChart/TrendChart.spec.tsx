import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrendChart } from "./TrendChart";
import type { TrendSeries } from "./TrendChart.types";

const series: TrendSeries[] = [
  { key: "counter", label: "Counter", color: "#2f7d52", rev: [10, 20], ord: [1, 2] },
];

describe("TrendChart", () => {
  it("renders an empty prompt when no series is selected", () => {
    function valOf() {
      return 0;
    }
    function fmt(value: number) {
      return String(value);
    }
    const { rerender } = render(
      <TrendChart labels={["Mon"]} series={[]} type="group" valOf={valOf} fmtAxis={fmt} fmt={fmt} />,
    );
    expect(screen.getByText("Select at least one source above.")).toBeTruthy();
    rerender(<TrendChart labels={["Mon", "Tue"]} series={series} type="line" valOf={valOf} fmtAxis={fmt} fmt={fmt} />);
    expect(screen.getByRole("img")).toBeTruthy();
  });
});
