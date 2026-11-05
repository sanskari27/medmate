import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No bills" body="Sales from today show up here." />);
    expect(screen.getByRole("heading", { name: "No bills" })).toBeTruthy();
  });
});
