import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a disabled primary button", () => {
    render(
      <Button variant="primary" disabled>
        Save bill
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save bill" });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.className).toContain("bg-mid");
  });
});
