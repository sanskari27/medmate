import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    doctors: [],
    departments: [],
    addDoctor: vi.fn(),
    updateDoctor: vi.fn(),
  }),
}));

import DoctorsScreen from "./Doctors";

describe("Doctors", () => {
  it("renders the directory actions", () => {
    render(<DoctorsScreen />);
    expect(screen.getByRole("button", { name: "Add Doctor" })).toBeTruthy();
    expect(screen.getByText("No doctors match. Add one with “Add Doctor”.")).toBeTruthy();
  });
});
