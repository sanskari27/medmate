import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("exposes the accessible name", () => {
    render(<IconButton label="Close">x</IconButton>);
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
  });
});
