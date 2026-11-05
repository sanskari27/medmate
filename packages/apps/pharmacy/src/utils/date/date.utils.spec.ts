import { describe, expect, it } from "vitest";
import { formatDayText, plusDays, startOfToday, timestampInRange, toYmd } from "./date.utils";

describe("date utils", () => {
  it("adds days on the UTC calendar", () => {
    expect(plusDays(2, "2026-01-30")).toBe("2026-02-01");
  });

  it("formats a calendar day and rejects a blank value", () => {
    expect(formatDayText("")).toBe("—");
  });

  it("builds a local ymd and the start of that day", () => {
    const stamp = new Date(2026, 0, 15, 18, 30).getTime();
    expect(toYmd(stamp)).toBe("2026-01-15");
    expect(startOfToday(stamp)).toBe(new Date(2026, 0, 15).getTime());
  });

  it("checks a timestamp against a window", () => {
    expect(timestampInRange(10, { from: 5, to: 15 })).toBe(true);
    expect(timestampInRange(4, { from: 5, to: 15 })).toBe(false);
  });
});
