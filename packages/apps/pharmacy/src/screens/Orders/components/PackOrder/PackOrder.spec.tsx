import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PackOrder from "./PackOrder";

vi.mock("@/hooks", () => ({
  usePharma: function usePharma() {
    return {
      sales: [
        {
          id: "INV-9",
          status: "accepted",
          channel: "online",
          customer: { name: "Asha" },
          items: [],
          discount: 0,
          fulfillment: { lines: [] },
        },
      ],
      inventory: [],
      profile: { name: "Pharmacy" },
      startPacking() {},
      scanPackLine() {
        return Promise.resolve(null);
      },
      pickPackLine() {},
      sealPacket() {},
      handToRider() {},
      advanceOrder() {},
      toast() {},
    };
  },
}));

describe("PackOrder", () => {
  it("renders the pack step", () => {
    render(<PackOrder saleId="INV-9" onClose={ignore} />);
    expect(screen.getByText("Scan each medicine to pack")).toBeTruthy();
  });
});

function ignore() {}
