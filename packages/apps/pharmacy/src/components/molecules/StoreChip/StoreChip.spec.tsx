import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoreChip } from "./StoreChip";

describe("StoreChip", () => {
  it("describes whether the store is accepting orders", () => {
    const view = render(<StoreChip name="Sri Sai" open />);
    expect(screen.getByText("Sri Sai")).toBeTruthy();
    expect(screen.getByText("● Online · accepting orders")).toBeTruthy();
    view.rerender(<StoreChip name="Sri Sai" open={false} />);
    expect(screen.getByText("○ Online store paused")).toBeTruthy();
  });
});
