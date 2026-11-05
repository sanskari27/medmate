import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiStat } from "./KpiStat";

describe("KpiStat", () => {
  it("renders the metric", () => {
    render(<KpiStat label="Sales" value="₹1,200" hint="Today" />);
    expect(screen.getByText("₹1,200")).toBeTruthy();
  });
});
