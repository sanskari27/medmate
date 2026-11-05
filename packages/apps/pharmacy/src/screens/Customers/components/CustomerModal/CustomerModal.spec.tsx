import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CustomerAccount } from "../../Customers.types";
import { CustomerModal } from "./CustomerModal";

const customer = {
  key: "walkin",
  name: "Walk-in",
  phone: "",
  orders: [],
  spent: 0,
  units: 0,
  online: 0,
  offline: 0,
  last: 0,
  rx: false,
} as CustomerAccount;

describe("CustomerModal", () => {
  it("opens a walk-in account", () => {
    render(
      <CustomerModal
        customer={customer}
        onClose={function close() {}}
        onNewSale={function sale() {}}
        sales={[]}
        creditPayments={[]}
        recordCreditPayment={async function pay() {
          return null;
        }}
        profile={{ name: "Sri Sai Medicals" } as never}
      />,
    );
    expect(screen.getByText("Walk-in")).toBeTruthy();
  });
});
