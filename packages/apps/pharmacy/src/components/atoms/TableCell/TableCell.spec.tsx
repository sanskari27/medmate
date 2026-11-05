import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableCell } from "./TableCell";

describe("TableCell", () => {
  it("renders a td", () => {
    render(<TableCell>Cell</TableCell>);
    expect(screen.getByText("Cell").tagName).toBe("TD");
  });
});
