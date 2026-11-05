import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    employees: [],
    addEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    now: 0,
    profile: { name: "Green Cross", phone: "", address: "", city: "", state: "" },
  }),
}));

import EmployeesScreen from "./Employees";

describe("Employees", () => {
  it("renders the team directory", () => {
    render(<EmployeesScreen />);
    expect(screen.getByRole("button", { name: "Add Employee" })).toBeTruthy();
    expect(screen.getByText("No employees match this filter. Add your first team member.")).toBeTruthy();
  });
});
