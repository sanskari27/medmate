import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Divider } from "./Divider";

describe("Divider", () => {
  it("exposes a separator", () => {
    render(<Divider />);
    expect(screen.getByRole("separator")).toBeTruthy();
  });
});
