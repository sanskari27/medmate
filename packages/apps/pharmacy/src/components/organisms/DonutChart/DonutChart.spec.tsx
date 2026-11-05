import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DonutChart } from "./DonutChart";

describe("DonutChart", () => {
  it("renders a legend row for each source", () => {
    function fmt(value: number) {
      return `₹${value}`;
    }
    render(
      <DonutChart
        fmt={fmt}
        rows={[
          { key: "counter", label: "Counter", color: "#2f7d52", amt: 80 },
          { key: "online", label: "Online", color: "#2563eb", amt: 20 },
        ]}
      />,
    );
    expect(screen.getByText("Counter")).toBeTruthy();
    expect(screen.getByText("total")).toBeTruthy();
  });
});
