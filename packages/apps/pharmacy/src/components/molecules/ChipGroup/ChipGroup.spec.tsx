import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Chip } from "@/components/molecules/Chip";
import { ChipGroup } from "./ChipGroup";

describe("ChipGroup", () => {
  it("groups chips in a row", () => {
    render(
      <ChipGroup aria-label="Filters">
        <Chip>All</Chip>
      </ChipGroup>,
    );
    expect(screen.getByRole("group", { name: "Filters" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "All" })).toBeTruthy();
  });
});
