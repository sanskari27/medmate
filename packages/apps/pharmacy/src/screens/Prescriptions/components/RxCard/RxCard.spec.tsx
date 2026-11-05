import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Prescription } from "@/utils";
import { RxCard } from "./RxCard";

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

describe("RxCard", () => {
  it("shows the prescription id and patient", () => {
    function open() {}
    function approve() {}
    function reject() {}
    function dispense() {}
    render(
      <RxCard
        prescription={prescription}
        now={prescription.uploadedAt}
        inventory={[]}
        onOpen={open}
        onApprove={approve}
        onReject={reject}
        onDispense={dispense}
      />,
    );
    expect(screen.getByText("RX-9")).toBeTruthy();
    expect(screen.getByText("Anita Das")).toBeTruthy();
  });
});
