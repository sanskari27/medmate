import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stack } from "./Stack";

describe("Stack", () => {
  it("renders a column with the requested gap", () => {
    render(<Stack gap={3}>Lines</Stack>);
    expect(screen.getByText("Lines").className).toContain("flex-col");
    expect(screen.getByText("Lines").className).toContain("gap-3");
  });
});
