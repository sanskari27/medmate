import { EMPLOYMENT_TYPES, type Employee, type EmployeeDoc } from "@/utils";
import type { EmployeeDraft, EmployeeFilters } from "./Employees.types";

export function filterEmployees(employees: Employee[], filters: EmployeeFilters): Employee[] {
  const needle = filters.query.trim().toLowerCase();
  return employees
    .filter(function matchEmployee(employee) {
      if (filters.position !== "all" && employee.position !== filters.position) return false;
      if (filters.status !== "all" && employee.status !== filters.status) return false;
      if (!needle) return true;
      return `${employee.id} ${employee.name} ${employee.position} ${employee.phone} ${employee.department ?? ""}`
        .toLowerCase()
        .includes(needle);
    })
    .sort(function byCode(left, right) {
      return left.id.localeCompare(right.id);
    });
}

export function countByPosition(employees: Employee[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const employee of employees)
    counts.set(employee.position, (counts.get(employee.position) ?? 0) + 1);
  return [...counts.entries()].sort(function byCount(left, right) {
    return right[1] - left[1];
  });
}

export function countEmployment(employees: Employee[]) {
  return EMPLOYMENT_TYPES.map(function countType(employment) {
    return {
      employment,
      count: employees.filter(function matches(employee) {
        return employee.employment === employment;
      }).length,
    };
  });
}

export function documentTotals(employees: Employee[]) {
  let total = 0;
  let missing = 0;
  for (const employee of employees) {
    const count = employee.documents?.length ?? 0;
    total += count;
    if (count === 0) missing += 1;
  }
  return { total, missing };
}

export function activeEmployeeCount(employees: Employee[]): number {
  return employees.filter(function isActive(employee) {
    return employee.status === "active";
  }).length;
}

export function employeeDraftIsValid(draft: EmployeeDraft, ifscIsInvalid: boolean): boolean {
  return Boolean(
    draft.name.trim() &&
    draft.phone.trim() &&
    draft.position &&
    draft.salary >= 0 &&
    !ifscIsInvalid,
  );
}

export function csvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function employeesCsv(rows: Employee[]): string {
  const head = [
    "Code",
    "Name",
    "Position",
    "Department",
    "Employment",
    "Status",
    "Phone",
    "Email",
    "DOB",
    "Joined",
    "Monthly salary",
    "PAN",
    "Aadhaar",
    "Bank",
    "Account name",
    "Account no",
    "IFSC",
    "UPI",
    "Emergency contact",
    "Address",
  ];
  const lines = rows.map(function toLine(employee) {
    return [
      employee.id,
      employee.name,
      employee.position,
      employee.department ?? "",
      employee.employment,
      employee.status,
      employee.phone,
      employee.email ?? "",
      employee.dob ?? "",
      employee.joinedOn,
      employee.salary,
      employee.pan ?? "",
      employee.aadhaar ?? "",
      employee.bankName ?? "",
      employee.accountName ?? "",
      employee.accountNumber ?? "",
      employee.ifsc ?? "",
      employee.upi ?? "",
      employee.emergencyName ? `${employee.emergencyName} ${employee.emergencyPhone ?? ""}` : "",
      employee.address ?? "",
    ];
  });
  return [head, ...lines]
    .map(function joinRow(row) {
      return row.map(csvCell).join(",");
    })
    .join("\n");
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(function revokeUrl() {
    URL.revokeObjectURL(url);
  }, 6000);
}

export function idCardValidThrough(joinedOn: string): string {
  const joined = new Date(joinedOn);
  if (Number.isNaN(joined.getTime())) return "—";
  joined.setFullYear(joined.getFullYear() + 3);
  return joined.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function documentKind(file: File): EmployeeDoc["kind"] {
  return /pdf$/i.test(file.name) || file.type === "application/pdf" ? "pdf" : "image";
}

export function readFileAsDataUrl(file: File, onLoad: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = function handleLoad() {
    if (typeof reader.result === "string") onLoad(reader.result);
  };
  reader.readAsDataURL(file);
}

export function barPercent(count: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((count / max) * 100);
}
