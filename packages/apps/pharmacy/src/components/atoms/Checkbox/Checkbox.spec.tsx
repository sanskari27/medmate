import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders a checkbox with its caption", () => {
    render(<Checkbox>Remember</Checkbox>);
    expect(screen.getByRole("checkbox", { name: "Remember" })).toBeTruthy();
  });
});
