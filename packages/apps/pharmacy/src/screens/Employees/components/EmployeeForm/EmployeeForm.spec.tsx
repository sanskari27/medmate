import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmployeeForm } from "./EmployeeForm";

describe("EmployeeForm", () => {
  it("opens the add-employee form", () => {
    render(
      <EmployeeForm
        initial={null}
        now={0}
        onClose={function close() {}}
        onSave={function save() {}}
      />,
    );
    expect(screen.getByText("Add Employee")).toBeTruthy();
  });
});
