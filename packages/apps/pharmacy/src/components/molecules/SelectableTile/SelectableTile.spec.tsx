import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SelectableTile } from "./SelectableTile";

describe("SelectableTile", () => {
  it("paints a selected payment tile", () => {
    render(
      <SelectableTile selected kind="pay">
        UPI
      </SelectableTile>,
    );
    const tile = screen.getByRole("button", { name: "UPI" });
    expect(tile.className.includes("bg-wash")).toBe(true);
    expect(tile.className.includes("border-mid")).toBe(true);
  });

  it("rings a selected source card", () => {
    render(
      <SelectableTile selected kind="source">
        Counter
      </SelectableTile>,
    );
    const tile = screen.getByRole("button", { name: "Counter" });
    expect(tile.className.includes("shadow-[0_0_0_3px_rgba(47,125,82,0.14)]")).toBe(true);
  });
});
