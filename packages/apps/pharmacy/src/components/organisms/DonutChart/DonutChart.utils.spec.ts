import { describe, expect, it } from "vitest";
import { DONUT_CENTER, buildDonutArcs, polar } from "./DonutChart.utils";

describe("polar", () => {
  it("places angle 0 to the right of the donut center", () => {
    const [x, y] = polar(0, 10);
    expect(x).toBeCloseTo(DONUT_CENTER + 10);
    expect(y).toBeCloseTo(DONUT_CENTER);
  });
});

describe("buildDonutArcs", () => {
  it("drops empty slices and builds a path for each remaining amount", () => {
    const { total, arcs } = buildDonutArcs([
      { key: "a", label: "A", color: "#111", amt: 1 },
      { key: "b", label: "B", color: "#222", amt: 0 },
      { key: "c", label: "C", color: "#333", amt: 1 },
    ]);
    expect(total).toBe(2);
    expect(arcs).toHaveLength(2);
    expect(arcs[0].d.startsWith("M ")).toBe(true);
    expect(arcs[0].frac).toBeCloseTo(0.5);
  });
});
