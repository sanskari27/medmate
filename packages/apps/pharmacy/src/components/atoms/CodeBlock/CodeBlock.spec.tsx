import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "./CodeBlock";

describe("CodeBlock", () => {
  it("renders preformatted text", () => {
    render(<CodeBlock>gstin: 18</CodeBlock>);
    expect(screen.getByText("gstin: 18").tagName).toBe("PRE");
  });
});
