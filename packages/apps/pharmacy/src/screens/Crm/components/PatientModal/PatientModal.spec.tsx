import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Patient } from "@/utils/calculations/crm";
import { emptyCrmView } from "../crmView";
import { PatientModal } from "./PatientModal";

const patient = {
  key: "p1",
  name: "Anita Rao",
  phone: "9999999999",
  orders: 0,
  spent: 0,
  units: 0,
  firstAt: 0,
  lastAt: 0,
  online: false,
  onlineOrders: 0,
  rx: false,
  categories: [],
  chronic: false,
  points: 0,
  tier: "Bronze",
  avgOrder: 0,
  medicines: [],
  payModes: [],
  rfm: { r: 0, f: 0, m: 0, score: 0 },
  segments: [],
  churnRisk: false,
  daysSince: 0,
} as unknown as Patient;

describe("PatientModal", () => {
  it("shows the patient name", () => {
    render(<PatientModal patient={patient} view={emptyCrmView} onClose={function close() {}} />);
    expect(screen.getByText("Anita Rao")).toBeTruthy();
  });
});
