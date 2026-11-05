import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonoText } from "./MonoText";

describe("MonoText", () => {
  it("uses the mono face", () => {
    render(<MonoText>INV-12</MonoText>);
    expect(screen.getByText("INV-12").className).toContain("font-mono");
  });
});
