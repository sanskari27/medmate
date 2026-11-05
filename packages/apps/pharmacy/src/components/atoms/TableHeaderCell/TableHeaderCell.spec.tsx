import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableHeaderCell } from "./TableHeaderCell";

describe("TableHeaderCell", () => {
  it("renders a th", () => {
    render(<TableHeaderCell>Cell</TableHeaderCell>);
    expect(screen.getByText("Cell").tagName).toBe("TH");
  });
});
