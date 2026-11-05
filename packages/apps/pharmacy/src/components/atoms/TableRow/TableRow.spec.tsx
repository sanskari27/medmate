import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableRow } from "./TableRow";

describe("TableRow", () => {
  it("renders a tr", () => {
    render(<TableRow>Cell</TableRow>);
    expect(screen.getByText("Cell").tagName).toBe("TR");
  });
});
