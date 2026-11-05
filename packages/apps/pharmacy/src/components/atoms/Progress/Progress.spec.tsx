import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./Progress";

describe("Progress", () => {
  it("exposes the current value", () => {
    render(<Progress value={40} label="Stock" />);
    expect(screen.getByRole("progressbar", { name: "Stock" }).getAttribute("aria-valuenow")).toBe(
      "40",
    );
  });
});
