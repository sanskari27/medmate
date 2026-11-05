import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { InvProduct } from "@/utils";
import { ProductCard } from "./ProductCard";

const product = {
  id: "1",
  name: "Dolo 650",
  composition: "Paracetamol",
  manufacturer: "Micro",
  form: "Tablet",
  pack: "Strip of 15",
  category: "fever",
  hsn: "3004",
  gst: 12,
  schedule: "OTC",
  rack: "",
  reorderLevel: 0,
  online: true,
  batches: [],
} as InvProduct;

describe("ProductCard", () => {
  it("renders the medicine name and an out-of-stock label", () => {
    render(<ProductCard product={product} packCount={0} looseCount={0} onAddPack={ignore} onAddLoose={ignore} />);
    expect(screen.getByText("Dolo 650")).toBeTruthy();
    expect(screen.getByText("Out of stock")).toBeTruthy();
  });
});

function ignore() {}
