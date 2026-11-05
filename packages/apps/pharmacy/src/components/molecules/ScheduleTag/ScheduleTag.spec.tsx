import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScheduleTag } from "./ScheduleTag";

describe("ScheduleTag", () => {
  it("labels OTC and prescription schedules", () => {
    const view = render(<ScheduleTag schedule="OTC" />);
    expect(screen.getByText("OTC").getAttribute("title")).toBe(
      "Over the counter — no prescription needed",
    );
    view.rerender(<ScheduleTag schedule="H" />);
    expect(screen.getByText("Sch. H").getAttribute("title")).toBe("Prescription required");
  });
});
