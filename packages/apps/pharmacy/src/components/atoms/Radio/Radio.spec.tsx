import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Radio } from "./Radio";

describe("Radio", () => {
  it("renders a radio with its caption", () => {
    render(<Radio name="plan">Yearly</Radio>);
    expect(screen.getByRole("radio", { name: "Yearly" })).toBeTruthy();
  });
});
