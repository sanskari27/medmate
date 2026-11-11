import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("reports the checked state and accessible name", () => {
    const view = render(<Switch checked label="Unblock account" />);
    expect(
      screen.getByRole("switch", { name: "Unblock account" }).getAttribute("aria-checked"),
    ).toBe("true");
    view.rerender(<Switch checked={false} label="Block account" />);
    expect(screen.getByRole("switch", { name: "Block account" }).getAttribute("aria-checked")).toBe(
      "false",
    );
  });
});
