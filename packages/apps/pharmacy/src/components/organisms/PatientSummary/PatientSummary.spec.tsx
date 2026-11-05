import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PatientSummary } from "./PatientSummary";

describe("PatientSummary", () => {
  it("renders the patient name, tier, and phone", () => {
    render(
      <PatientSummary name="Asha Rao" tier="Gold" phone="9886012345" lastSeen="seen today" chronic />,
    );
    expect(screen.getByRole("heading", { name: "Asha Rao" })).toBeTruthy();
    expect(screen.getByText("Gold")).toBeTruthy();
    expect(screen.getByText("9886012345")).toBeTruthy();
    expect(screen.getByText("chronic")).toBeTruthy();
  });
});
