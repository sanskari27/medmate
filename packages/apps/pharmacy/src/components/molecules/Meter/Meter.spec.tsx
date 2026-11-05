import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Meter } from "./Meter";

describe("Meter", () => {
  it("shows the label and the bar", () => {
    render(<Meter label="Used" valueLabel="40%" value={40} />);
    expect(screen.getByText("Used")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Used" })).toBeTruthy();
  });
});
