import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Prescription } from "@/utils";
import RxView from "./RxView";

const rx = {
  id: "RX-1",
  patient: "Asha",
  phone: "9886012345",
  doctor: "Dr. Rao",
  uploadedAt: Date.parse("2026-06-15T10:00:00"),
  channel: "offline",
  status: "pending",
  items: [],
  kind: "digital",
  meds: [{ name: "Paracetamol", dose: "500mg", days: 3 }],
} satisfies Prescription;

describe("RxView", () => {
  it("renders a digital prescription", () => {
    render(<RxView rx={rx} />);
    expect(screen.getByText("Namma MedMate · Digital Prescription")).toBeTruthy();
    expect(screen.getByText("Paracetamol")).toBeTruthy();
  });
});
