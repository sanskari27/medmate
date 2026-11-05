import { describe, expect, it } from "vitest";
import { PaymentModal } from "./PaymentModal";

describe("PaymentModal", () => {
  it("exports the component", () => {
    expect(typeof PaymentModal).toBe("function");
  });
});
