import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { blankDoctor } from "@/utils/calculations/hospital";
import { DoctorCard } from "./DoctorCard";

describe("DoctorCard", () => {
  it("shows the doctor name", () => {
    render(
      <DoctorCard
        doctor={{ ...blankDoctor(), id: "d1", name: "Dr. Rao" }}
        onEdit={function edit() {}}
      />,
    );
    expect(screen.getByRole("heading", { name: "Dr. Rao" })).toBeTruthy();
  });
});
