import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Box } from "./Box";

describe("Box", () => {
  it("renders children in a div", () => {
    render(<Box className="p-2">Shelf</Box>);
    expect(screen.getByText("Shelf").tagName).toBe("DIV");
    expect(screen.getByText("Shelf").className).toContain("p-2");
  });
});
