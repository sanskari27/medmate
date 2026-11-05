import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Grid } from "./Grid";

describe("Grid", () => {
  it("renders a grid", () => {
    render(<Grid columns={2}>Cards</Grid>);
    expect(screen.getByText("Cards").className).toContain("grid");
  });
});
