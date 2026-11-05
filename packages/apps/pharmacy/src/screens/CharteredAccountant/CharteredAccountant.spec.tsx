import { describe, expect, it } from "vitest";
import { togglePicked } from "./CharteredAccountant.utils";

describe("togglePicked", () => {
  it("adds a report key and removes it on the next toggle", () => {
    expect(togglePicked(["gst"], "sales")).toEqual(["gst", "sales"]);
    expect(togglePicked(["gst", "sales"], "sales")).toEqual(["gst"]);
  });
});
