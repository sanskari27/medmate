import { describe, expect, it } from "vitest";
import { buildTrendGeometry, centerX, valueY } from "./TrendChart.utils";

describe("buildTrendGeometry", () => {
  it("rounds the axis max up to a power of ten", () => {
    const geometry = buildTrendGeometry(4, 240);
    expect(geometry.max).toBe(300);
    expect(geometry.grid).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(geometry.band).toBeGreaterThan(0);
  });
});

describe("centerX", () => {
  it("centers a band inside the plot", () => {
    const geometry = buildTrendGeometry(2, 100);
    expect(centerX(geometry, 0)).toBeCloseTo(geometry.padLeft + geometry.band * 0.5);
  });
});

describe("valueY", () => {
  it("puts the max value at the top of the plot", () => {
    const geometry = buildTrendGeometry(2, 100);
    expect(valueY(geometry, geometry.max)).toBeCloseTo(geometry.padTop);
  });
});
