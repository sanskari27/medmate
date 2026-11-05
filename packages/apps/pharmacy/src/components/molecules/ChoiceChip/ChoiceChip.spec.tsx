import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChoiceChip } from "./ChoiceChip";

describe("ChoiceChip", () => {
  it("highlights the selected source", () => {
    render(<ChoiceChip selected>OPD</ChoiceChip>);
    const chip = screen.getByRole("button", { name: "OPD" });
    expect(chip.getAttribute("data-slot")).toBe("choice-chip");
    expect(chip.className.includes("border-mid")).toBe(true);
    expect(chip.className.includes("bg-wash-2")).toBe(true);
  });
});
