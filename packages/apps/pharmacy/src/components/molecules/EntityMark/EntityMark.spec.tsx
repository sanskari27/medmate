import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, CategoryIcon } from "./EntityMark";

describe("EntityMark", () => {
  it("draws a category icon and person initials", () => {
    const { container } = render(<CategoryIcon k="fever" />);
    expect(container.querySelector("svg")).toBeTruthy();
    render(<Avatar name="Asha Devi" />);
    expect(screen.getByText("AD")).toBeTruthy();
  });
});
