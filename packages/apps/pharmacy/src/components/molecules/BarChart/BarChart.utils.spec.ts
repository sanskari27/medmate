import { describe, expect, it } from "vitest";
import { layoutBars } from "./BarChart.utils";

describe("layoutBars", () => {
  it("stacks the first segment above the second and scales to the tallest column", () => {
    const layout = layoutBars(
      [
        {
          label: "Mon",
          segments: [
            { value: 30, tone: "on" },
            { value: 10, tone: "off" },
          ],
        },
        { label: "Tue", segments: [{ value: 20, tone: "on" }] },
      ],
      100,
    );
    const monday = layout.columns[0];
    const tuesday = layout.columns[1];
    const on = monday?.rects[0];
    const off = monday?.rects[1];
    expect(on?.tone).toBe("on");
    expect(off?.tone).toBe("off");
    expect(on && off ? on.y < off.y : false).toBe(true);
    expect(on && off ? on.height / off.height : 0).toBeCloseTo(3);
    expect(monday && tuesday ? monday.clip.height / tuesday.clip.height : 0).toBeCloseTo(2);
  });

  it("keeps an empty column at the minimum stack height", () => {
    const layout = layoutBars([{ label: "Wed", segments: [{ value: 0, tone: "on" }] }]);
    expect(layout.columns[0]?.clip.height).toBe(4);
    expect(layout.columns[0]?.rects.length).toBe(0);
  });
});
