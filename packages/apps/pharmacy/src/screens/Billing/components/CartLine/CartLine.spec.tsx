import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { InvProduct } from "@/utils";
import { CartLine } from "./CartLine";

const product = {
  id: "1",
  name: "Dolo 650",
  gst: 12,
  rack: "",
  batches: [],
  form: "Tablet",
  pack: "Strip of 15",
} as unknown as InvProduct;

describe("CartLine", () => {
  it("renders the line name and amount", () => {
    render(
      <CartLine
        line={{ productId: "1", qty: 2 }}
        view={{ product, loose: false, pinned: null, batch: null, unit: 30, maxQty: 10 }}
        onDecrease={ignore}
        onIncrease={ignore}
        onQuantity={ignore}
        onRemove={ignore}
        onBatch={ignore}
      />,
    );
    expect(screen.getByText(/Dolo 650/)).toBeTruthy();
    expect(screen.getByText("₹60")).toBeTruthy();
  });
});

function ignore() {}
