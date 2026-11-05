import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { blankEmployee } from "@/utils";
import { EmployeeIdCard } from "./EmployeeIdCard";

describe("EmployeeIdCard", () => {
  it("prints the employee name on the card", () => {
    render(
      <EmployeeIdCard
        employee={{ ...blankEmployee(), id: "EMP-001", name: "Meera Nair" }}
        profile={{ name: "Sri Sai Medicals" } as never}
        onClose={function close() {}}
      />,
    );
    expect(screen.getAllByText(/Meera Nair/).length).toBeGreaterThan(0);
  });
});
