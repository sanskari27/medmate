import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PharmacyProfile, Sale } from "@/utils";
import { OrderDetail } from "./OrderDetail";

const sale = {
  id: "INV-1",
  channel: "offline",
  status: "delivered",
  customer: { name: "Asha" },
  items: [
    { productId: "p", batchNo: "B1", name: "Dolo", qty: 1, price: 10, mrp: 10, gst: 5, hsn: "" },
  ],
  discount: 0,
  payMode: "cash",
  paid: true,
  createdAt: 1,
  history: [{ status: "delivered", at: 1 }],
} as Sale;

describe("OrderDetail", () => {
  it("renders the order", () => {
    render(
      <OrderDetail
        sale={sale}
        profile={{ name: "Pharmacy" } as PharmacyProfile}
        onClose={ignore}
        onAdvance={ignore}
        onCancel={ignore}
        onMarkPaid={ignore}
        onShare={ignore}
        onOpenRx={ignore}
        now={2}
      />,
    );
    expect(screen.getByText("Details & history")).toBeTruthy();
    expect(screen.getByText("Dolo")).toBeTruthy();
  });
});

function ignore() {}
