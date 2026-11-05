import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryChip } from "./SummaryChip";

describe("SummaryChip", () => {
  it("shows the label and the figure", () => {
    render(<SummaryChip label="Bills" value="12" />);
    expect(screen.getByText("Bills")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });
});
