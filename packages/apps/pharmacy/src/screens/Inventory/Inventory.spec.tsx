import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InventoryScreen from "./Inventory";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    inventory: [],
    sales: [],
    profile: { name: "Pharmacy" },
    now: 0,
    toggleOnline() {},
    toggleLoose() {},
    updateProduct() {
      return Promise.resolve(null);
    },
    go() {},
    invFilter: null,
    setInvFilter() {},
    importMedicines() {
      return Promise.resolve({ skipped: [] });
    },
    showFault() {},
    toast() {},
  }),
}));

describe("InventoryScreen", () => {
  it("renders the empty catalogue", () => {
    render(<InventoryScreen />);
    expect(screen.getByText("Total SKUs")).toBeTruthy();
    expect(screen.getByText("No products yet — add stock by entering a distributor purchase bill.")).toBeTruthy();
  });
});
