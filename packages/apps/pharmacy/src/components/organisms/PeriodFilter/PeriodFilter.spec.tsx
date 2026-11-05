import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Box } from "@/components/atoms/Box";
import { usePeriod } from "./PeriodFilter";

function Probe() {
  const period = usePeriod(Date.parse("2026-06-15T12:00:00"), "month");
  return <Box>{period.node}</Box>;
}

describe("PeriodFilter", () => {
  it("renders the month period controls", () => {
    render(<Probe />);
    expect(screen.getByRole("combobox", { name: "Period" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Single" })).toBeTruthy();
    expect(screen.getByLabelText("Month")).toBeTruthy();
  });
});
