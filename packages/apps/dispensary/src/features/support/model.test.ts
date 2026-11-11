import { describe, expect, it } from "vitest";
import { timeAgo } from "./model";

describe("timeAgo", () => {
  const now = Date.parse("2026-11-12T12:00:00Z");

  it("names minutes, hours, and days", () => {
    expect(timeAgo("2026-11-12T11:58:00Z", now)).toBe("2 m ago");
    expect(timeAgo("2026-11-12T10:00:00Z", now)).toBe("2 h ago");
    expect(timeAgo("2026-11-10T12:00:00Z", now)).toBe("2 d ago");
  });
});
