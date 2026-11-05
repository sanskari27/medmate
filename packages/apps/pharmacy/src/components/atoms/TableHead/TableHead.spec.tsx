import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableHead } from "./TableHead";

describe("TableHead", () => {
  it("renders a thead", () => {
    render(<TableHead>Cell</TableHead>);
    expect(screen.getByText("Cell").tagName).toBe("THEAD");
  });
});
