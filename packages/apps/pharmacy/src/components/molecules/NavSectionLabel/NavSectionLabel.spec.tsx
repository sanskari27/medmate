import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavSectionLabel } from "./NavSectionLabel";

describe("NavSectionLabel", () => {
  it("renders the group name", () => {
    render(<NavSectionLabel>Hospital</NavSectionLabel>);
    const label = screen.getByText("Hospital");
    expect(label.getAttribute("data-slot")).toBe("nav-section-label");
    expect(label.className.includes("uppercase")).toBe(true);
  });
});
