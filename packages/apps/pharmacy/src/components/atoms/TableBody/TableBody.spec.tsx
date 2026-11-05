import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableBody } from "./TableBody";

describe("TableBody", () => {
  it("renders a tbody", () => {
    render(<TableBody>Cell</TableBody>);
    expect(screen.getByText("Cell").tagName).toBe("TBODY");
  });
});
