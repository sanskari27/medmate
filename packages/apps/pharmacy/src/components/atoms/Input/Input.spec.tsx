import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("renders a input", () => {
    render(<Input aria-label="Input"  />);
    expect(screen.getByLabelText("Input").tagName).toBe("INPUT");
  });
});
