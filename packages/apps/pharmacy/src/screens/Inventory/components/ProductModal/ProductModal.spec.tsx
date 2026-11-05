import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { InvProduct } from "@/utils";
import { ProductModal } from "./ProductModal";

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
  rack: "A1",
  reorderLevel: 5,
  online: true,
  batches: [],
} as InvProduct;

describe("ProductModal", () => {
  it("renders the edit title", () => {
    render(<ProductModal product={product} onClose={ignore} onSave={ignore} />);
    expect(screen.getByText("Edit Dolo 650")).toBeTruthy();
  });
});

function ignore() {}
