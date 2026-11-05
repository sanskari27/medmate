import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { InvProduct } from "@/utils";
import { StockPill } from "./StockPill";

const product = {
  batches: [],
  reorderLevel: 5,
  name: "Paracetamol",
  pack: "Strip of 10",
} as unknown as InvProduct;

describe("StockPill", () => {
  it("marks an empty product out of stock", () => {
    render(<StockPill p={product} />);
    expect(screen.getByText("Out of stock")).toBeTruthy();
  });
});
