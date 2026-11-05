import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("shows initials when there is no photo", () => {
    render(<Avatar name="Ravi Kumar" />);
    expect(screen.getByText("RK")).toBeTruthy();
  });

  it("renders a photo when a source is given", () => {
    render(<Avatar name="Ravi Kumar" src="/ravi.png" />);
    expect(screen.getByRole("img", { name: "Ravi Kumar" }).getAttribute("src")).toBe("/ravi.png");
  });
});
