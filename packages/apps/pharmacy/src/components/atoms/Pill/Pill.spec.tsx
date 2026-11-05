import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pill } from "./Pill";

describe("Pill", () => {
  it("renders the label", () => {
    render(<Pill tone="gold">Low</Pill>);
    expect(screen.getByText("Low").className).toContain("bg-amber-bg");
  });
});
