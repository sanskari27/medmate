import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PayModePicker } from "./PayModePicker";

describe("PayModePicker", () => {
  it("renders the payment labels", () => {
    render(
      <PayModePicker options={[{ m: "cash", Ic: CashMark }]} selected="cash" onSelect={ignore} />,
    );
    expect(screen.getByRole("button", { name: "Cash" })).toBeTruthy();
  });
});

function CashMark() {
  return null;
}
function ignore() {}
