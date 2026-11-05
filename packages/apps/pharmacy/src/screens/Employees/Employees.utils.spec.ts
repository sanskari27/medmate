import { describe, expect, it } from "vitest";
import type { Employee } from "@/utils";
import {
  activeEmployeeCount,
  barPercent,
  documentKind,
  employeeDraftIsValid,
  filterEmployees,
  idCardValidThrough,
} from "./Employees.utils";
import type { EmployeeDraft } from "./Employees.types";

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "EMP-002",
    name: "Anjali Menon",
    position: "Pharmacist",
    phone: "9000000000",
    joinedOn: "2024-01-15",
    employment: "Full-time",
    salary: 25000,
    status: "active",
    ...overrides,
  };
}

describe("filterEmployees", () => {
  const rows = [
    employee(),
    employee({
      id: "EMP-001",
      name: "Ravi",
      position: "Cashier",
      status: "inactive",
      phone: "9111111111",
    }),
  ];

  it("sorts by employee code and filters position, status, and search text", () => {
    expect(
      filterEmployees(rows, { query: "", position: "all", status: "all" }).map(function idOf(row) {
        return row.id;
      }),
    ).toEqual(["EMP-001", "EMP-002"]);
    expect(
      filterEmployees(rows, { query: "ravi", position: "Cashier", status: "inactive" }),
    ).toHaveLength(1);
  });
});

describe("employee helpers", () => {
  it("counts active staff and rejects an invalid draft", () => {
    expect(activeEmployeeCount([employee(), employee({ id: "EMP-003", status: "inactive" })])).toBe(
      1,
    );
    const draft = employee() as EmployeeDraft;
    expect(employeeDraftIsValid(draft, false)).toBe(true);
    expect(employeeDraftIsValid({ ...draft, name: " " }, false)).toBe(false);
    expect(employeeDraftIsValid(draft, true)).toBe(false);
  });

  it("formats the id-card expiry and classifies uploads", () => {
    expect(idCardValidThrough("not-a-date")).toBe("—");
    expect(idCardValidThrough("2024-01-15")).toContain("2027");
    expect(documentKind({ name: "licence.PDF", type: "" } as File)).toBe("pdf");
    expect(documentKind({ name: "photo.jpg", type: "image/jpeg" } as File)).toBe("image");
    expect(barPercent(1, 4)).toBe(25);
  });
});
