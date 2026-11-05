import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Billing from "./Billing";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    inventory: [],
    pos: [],
    posAdd() {},
    posDec() {},
    posSetQty() {},
    posRemove() {},
    posClear() {},
    posSetBatch() {},
    scanToPos() {
      return null;
    },
    toast() {},
    posCustomer: { name: "", phone: "", email: "", rxSource: "doctor", doctor: "" },
    setPosCustomer() {},
    posDiscount: 0,
    setPosDiscount() {},
    posDiscountMode: "flat",
    setPosDiscountMode() {},
    posDiscountFlat: 0,
    posPay: "cash",
    setPosPay() {},
    posTotals: { gross: 0, taxable: 0, totalTax: 0, payable: 0 },
    posCount: 0,
    checkoutPos() {
      return Promise.resolve(null);
    },
    lastInvoice: null,
    setLastInvoice() {},
    profile: { name: "Pharmacy" },
    registerBack() {},
    isHospital: false,
    wards: [],
    posSource: "counter",
    setPosSource() {},
    posWard: "",
    setPosWard() {},
    posInsurer: "",
    setPosInsurer() {},
    posPatientId: "",
    setPosPatientId() {},
  }),
}));

describe("Billing", () => {
  it("renders the cart step", () => {
    render(<Billing />);
    expect(screen.getByText(/Cart & customer/)).toBeTruthy();
    expect(screen.getByText("Scan or tap a medicine to start billing.")).toBeTruthy();
  });
});
