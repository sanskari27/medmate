import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillSummary } from "./BillSummary";

describe("BillSummary", () => {
  it("renders the amount to pay", () => {
    render(
      <BillSummary
        gross={100}
        taxable={90}
        totalTax={10}
        payable={100}
        discount={0}
        discountMode="flat"
        discountAmount={0}
        onDiscount={ignore}
        onDiscountMode={ignore}
      />,
    );
    expect(screen.getByText("To pay")).toBeTruthy();
  });
});

function ignore() {}
