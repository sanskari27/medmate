import { describe, expect, it } from "vitest";
import type { InvProduct } from "@/utils";
import { billingCheckoutGates, billingInvoiceTitle, filterBillingProducts } from "./Billing.utils";

const product = {
  id: "1",
  name: "Paracetamol",
  composition: "Acetaminophen",
  manufacturer: "Acme",
  category: "fever",
  rack: "A1",
  batches: [],
} as unknown as InvProduct;

describe("filterBillingProducts", () => {
  it("keeps a product that matches the category and the search text", () => {
    expect(filterBillingProducts([product], "fever", "para")).toEqual([product]);
    expect(filterBillingProducts([product], "cold", "para")).toEqual([]);
  });
});

describe("billingInvoiceTitle", () => {
  it("names a credit bill and a reception bill", () => {
    expect(billingInvoiceTitle({ id: "INV-1", payMode: "credit" })).toBe("Bill INV-1 · on credit (khata)");
    expect(billingInvoiceTitle({ id: "INV-2", payMode: "cash", paid: false })).toBe("Bill INV-2 · sent to reception");
  });
});

describe("billingCheckoutGates", () => {
  it("requires a doctor when the cart has a prescription item", () => {
    const blocked = billingCheckoutGates({
      hasPrescriptionItem: true,
      doctor: "",
      payMode: "cash",
      customerName: "",
      insurer: "",
      isHospital: false,
      source: "counter",
      ward: "",
    });
    expect(blocked.readyToBill).toBe(false);
    expect(blocked.prescriptionReady).toBe(false);
  });
});
