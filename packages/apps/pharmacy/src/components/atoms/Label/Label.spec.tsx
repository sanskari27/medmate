import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./Label";

describe("Label", () => {
  it("renders a label", () => {
    render(<Label>Phone</Label>);
    expect(screen.getByText("Phone").tagName).toBe("LABEL");
  });
});
