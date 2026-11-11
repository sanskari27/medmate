import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "./Text";

describe("Text", () => {
  it("renders a paragraph by default", () => {
    render(<Text>Batch 12</Text>);
    expect(screen.getByText("Batch 12").tagName).toBe("P");
  });
});
