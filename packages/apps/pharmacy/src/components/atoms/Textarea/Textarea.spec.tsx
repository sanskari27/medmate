import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders a textarea", () => {
    render(<Textarea aria-label="Textarea" />);
    expect(screen.getByLabelText("Textarea").tagName).toBe("TEXTAREA");
  });
});
