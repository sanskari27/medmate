import { describe, expect, it } from "vitest";
import { SPARK_HEIGHT, SPARK_WIDTH, sparkAreaPath, sparkLinePath, sparkPoints } from "./Sparkline.utils";

describe("sparkPoints", () => {
  it("pins the ends and lifts the peak", () => {
    const points = sparkPoints([0, 10]);
    expect(points[0]?.x).toBe(0);
    expect(points[1]?.x).toBe(SPARK_WIDTH);
    expect(points[1]?.y).toBeLessThan(points[0]?.y ?? 0);
    expect(sparkLinePath(points).startsWith("M ")).toBe(true);
    expect(sparkAreaPath(points).endsWith(`L 0,${SPARK_HEIGHT} Z`)).toBe(true);
    expect(sparkLinePath([])).toBe("");
  });
});
