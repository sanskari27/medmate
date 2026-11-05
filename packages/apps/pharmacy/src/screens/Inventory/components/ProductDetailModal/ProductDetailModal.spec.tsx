import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { InvProduct } from "@/utils";
import { ProductDetailModal } from "./ProductDetailModal";

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
  reorderLevel: 5,
  online: false,
  batches: [],
} as InvProduct;

describe("ProductDetailModal", () => {
  it("renders the product name", () => {
    render(
      <ProductDetailModal
        product={product}
        sales={[]}
        now={0}
        onClose={ignore}
        onEdit={ignore}
        toggleOnline={ignore}
        toggleLoose={ignore}
        go={ignore}
      />,
    );
    expect(screen.getAllByText("Dolo 650").length).toBeGreaterThan(0);
  });
});

function ignore() {}
