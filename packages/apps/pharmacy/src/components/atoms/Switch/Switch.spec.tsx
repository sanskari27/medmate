import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("reports the checked state", () => {
    render(<Switch checked label="Online store" />);
    expect(screen.getByRole("switch", { name: "Online store" }).getAttribute("aria-checked")).toBe(
      "true",
    );
  });
});
