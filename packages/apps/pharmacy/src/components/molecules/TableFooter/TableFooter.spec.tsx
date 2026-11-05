import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableFooter } from "./TableFooter";

describe("TableFooter", () => {
  it("renders the footer copy", () => {
    render(<TableFooter>12 bills</TableFooter>);
    expect(screen.getByText("12 bills")).toBeTruthy();
  });
});
