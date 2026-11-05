import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Prescription } from "@/utils";
import { RxDetail } from "./RxDetail";

const prescription = {
  id: "RX-9",
  patient: "Anita Das",
  phone: "—",
  doctor: "Dr. Rao",
  uploadedAt: 1_700_000_000_000,
  channel: "offline",
  status: "pending",
  items: [],
  kind: "uploaded",
} as Prescription;

describe("RxDetail", () => {
  it("names the open prescription", () => {
    function close() {}
    function approve() {}
    function reject() {}
    function dispense() {}
    render(
      <RxDetail
        rx={prescription}
        inventory={[]}
        now={prescription.uploadedAt}
        onClose={close}
        onApprove={approve}
        onReject={reject}
        onDispense={dispense}
      />,
    );
    expect(screen.getByText("Prescription RX-9")).toBeTruthy();
  });
});
