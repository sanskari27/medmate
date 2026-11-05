import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDateRange } from "./DateRangeField";

describe("useDateRange", () => {
  it("resolves today and opens the preset list", () => {
    const now = new Date(2026, 0, 15, 12).getTime();
    const { result } = renderHook(function renderRange() {
      return useDateRange(now, "today");
    });
    expect(result.current.label).toBe("Today");
    expect(result.current.inWindow(now)).toBe(true);

    render(result.current.node);
    fireEvent.click(screen.getByRole("button", { name: /Today/ }));
    expect(screen.getByRole("button", { name: /Yesterday/ })).toBeTruthy();
  });
});
