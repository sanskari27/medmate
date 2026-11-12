export const POSITIONS = [
  "Owner",
  "Manager",
  "Pharmacist",
  "Cashier",
  "Delivery Executive",
  "Store Helper",
  "Accountant",
  "Housekeeping",
] as const;

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract"] as const;

export const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"] as const;

export const DOCUMENT_LABELS = [
  "Aadhaar card",
  "PAN card",
  "Pharmacist licence",
  "Appointment letter",
  "Educational certificate",
  "Experience letter",
  "Bank passbook",
  "Address proof",
  "Photograph",
  "Other",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type EmployeeStatus = "active" | "inactive";

export type EmployeeFile = {
  fileName: string;
  contentType: string;
  url: string;
};

export type EmployeeDocument = EmployeeFile & {
  id: string;
  label: string;
};

export type Employee = {
  id: string;
  name: string;
  position: string;
  department: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  dob: string | null;
  joinedOn: string | null;
  employment: EmploymentType;
  salary: number;
  status: EmployeeStatus;
  pan: string | null;
  aadhaar: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  upi: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  note: string | null;
  bloodGroup: string | null;
  photo: EmployeeFile | null;
  documents: EmployeeDocument[];
};

export type Workplace = {
  name: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  logoUrl: string | null;
};

export type EmployeeList = {
  workplace: Workplace;
  employees: Employee[];
};

export type EmployeeOne = {
  workplace: Workplace;
  employee: Employee;
};

export type EmployeeDraft = {
  name: string;
  phone: string;
  email: string;
  dob: string;
  bloodGroup: string;
  address: string;
  position: string;
  department: string;
  employment: EmploymentType;
  status: EmployeeStatus;
  joinedOn: string;
  salary: string;
  pan: string;
  aadhaar: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  upi: string;
  emergencyName: string;
  emergencyPhone: string;
  note: string;
};

export type PendingDocument = {
  label: string;
  file: File;
};

export type EmployeeAccess = {
  create: boolean;
  update: boolean;
  inactivate: boolean;
};

export function employeeAccess(
  role: string | null | undefined,
  permissions: string[] | undefined,
): EmployeeAccess {
  const owner = role === "owner";
  const keys = permissions ?? [];
  return {
    create: owner || keys.includes("employees:create"),
    update: owner || keys.includes("employees:update"),
    inactivate: owner || keys.includes("employees:delete"),
  };
}

export function canOpenEmployees(
  role: string | null | undefined,
  permissions: string[] | undefined,
): boolean {
  return role === "owner" || (permissions ?? []).includes("employees:read");
}

export function todayYmd(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function blankDraft(now = new Date()): EmployeeDraft {
  return {
    name: "",
    phone: "",
    email: "",
    dob: "",
    bloodGroup: "",
    address: "",
    position: "Pharmacist",
    department: "",
    employment: "Full-time",
    status: "active",
    joinedOn: todayYmd(now),
    salary: "0",
    pan: "",
    aadhaar: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    upi: "",
    emergencyName: "",
    emergencyPhone: "",
    note: "",
  };
}

export function draftFromEmployee(employee: Employee): EmployeeDraft {
  return {
    name: employee.name,
    phone: employee.phone,
    email: employee.email ?? "",
    dob: employee.dob ?? "",
    bloodGroup: employee.bloodGroup ?? "",
    address: employee.address ?? "",
    position: employee.position,
    department: employee.department ?? "",
    employment: employee.employment,
    status: employee.status,
    joinedOn: employee.joinedOn ?? "",
    salary: employee.salary ? String(employee.salary) : "",
    pan: employee.pan ?? "",
    aadhaar: employee.aadhaar ?? "",
    bankName: employee.bankName ?? "",
    accountName: employee.accountName ?? "",
    accountNumber: employee.accountNumber ?? "",
    ifsc: employee.ifsc ?? "",
    upi: employee.upi ?? "",
    emergencyName: employee.emergencyName ?? "",
    emergencyPhone: employee.emergencyPhone ?? "",
    note: employee.note ?? "",
  };
}

export function isValidIfsc(value: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase());
}

export function draftIsValid(draft: EmployeeDraft): boolean {
  const salary = draft.salary.trim() === "" ? 0 : Number(draft.salary);
  return Boolean(
    draft.name.trim() &&
    draft.phone.trim() &&
    draft.position &&
    Number.isInteger(salary) &&
    salary >= 0 &&
    (!draft.ifsc.trim() || isValidIfsc(draft.ifsc)),
  );
}

export function salaryAmount(draft: EmployeeDraft): number {
  return draft.salary.trim() === "" ? 0 : Number(draft.salary);
}

export type EmployeePayload = {
  name: string;
  phone: string;
  email: string;
  dob: string;
  bloodGroup: string;
  address: string;
  position: string;
  department: string;
  employment: EmploymentType;
  status: EmployeeStatus;
  joinedOn: string;
  salary: number;
  pan: string;
  aadhaar: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  upi: string;
  emergencyName: string;
  emergencyPhone: string;
  note: string;
  removePhoto?: boolean;
};

export function payload(draft: EmployeeDraft, removePhoto = false): EmployeePayload {
  return {
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    dob: draft.dob,
    bloodGroup: draft.bloodGroup,
    address: draft.address.trim(),
    position: draft.position,
    department: draft.department.trim(),
    employment: draft.employment,
    status: draft.status,
    joinedOn: draft.joinedOn,
    salary: salaryAmount(draft),
    pan: draft.pan.trim(),
    aadhaar: draft.aadhaar.trim(),
    bankName: draft.bankName.trim(),
    accountName: draft.accountName.trim(),
    accountNumber: draft.accountNumber.trim(),
    ifsc: draft.ifsc.trim().toUpperCase(),
    upi: draft.upi.trim(),
    emergencyName: draft.emergencyName.trim(),
    emergencyPhone: draft.emergencyPhone.trim(),
    note: draft.note.trim(),
    ...(removePhoto ? { removePhoto: true } : {}),
  };
}

export function toFormData(
  draft: EmployeeDraft,
  photo: File | null,
  removePhoto: boolean,
  documents: PendingDocument[],
): FormData {
  const body = new FormData();
  const fields = payload(draft, removePhoto);
  for (const [key, value] of Object.entries(fields)) {
    body.set(key, String(value));
  }
  if (photo) body.set("photo", photo);
  for (const document of documents) {
    body.append("documentTypes", document.label);
    body.append("documents", document.file);
  }
  return body;
}

export function filterEmployees(
  employees: Employee[],
  filters: { query: string; position: string; status: string },
): Employee[] {
  const needle = filters.query.trim().toLowerCase();
  return employees
    .filter((employee) => {
      if (filters.position !== "all" && employee.position !== filters.position) return false;
      if (filters.status !== "all" && employee.status !== filters.status) return false;
      if (!needle) return true;
      return `${employee.id} ${employee.name} ${employee.position} ${employee.phone} ${employee.department ?? ""}`
        .toLowerCase()
        .includes(needle);
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function countByPosition(employees: Employee[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const employee of employees) {
    counts.set(employee.position, (counts.get(employee.position) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1]);
}

export function employmentCount(employees: Employee[], employment: EmploymentType): number {
  return employees.filter((employee) => employee.employment === employment).length;
}

export function documentTotals(employees: Employee[]) {
  let total = 0;
  let missing = 0;
  for (const employee of employees) {
    const count = employee.documents.length;
    total += count;
    if (count === 0) missing += 1;
  }
  return { total, missing };
}

export function activeEmployeeCount(employees: Employee[]): number {
  return employees.filter((employee) => employee.status === "active").length;
}

export function monthlyPayroll(employees: Employee[]): number {
  return employees
    .filter((employee) => employee.status === "active")
    .reduce((sum, employee) => sum + employee.salary, 0);
}

export function employeeTenure(joinedOn: string, now: number): string {
  if (!joinedOn) return "—";
  const joined = new Date(joinedOn).getTime();
  if (Number.isNaN(joined)) return "—";
  const months = Math.max(0, Math.round((now - joined) / (30 * 86400000)));
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return years > 0 ? `${years}y ${rest}m` : `${rest}m`;
}

export function formatDayText(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function idCardValidThrough(joinedOn: string): string {
  const joined = new Date(joinedOn);
  if (Number.isNaN(joined.getTime())) return "—";
  joined.setFullYear(joined.getFullYear() + 3);
  return joined.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function inr(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

export function barPercent(count: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((count / max) * 100);
}

function csvCell(value: unknown): string {
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
  const lines = rows.map((employee) => [
    employee.id,
    employee.name,
    employee.position,
    employee.department ?? "",
    employee.employment,
    employee.status,
    employee.phone,
    employee.email ?? "",
    employee.dob ?? "",
    employee.joinedOn ?? "",
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
  ]);
  return [head, ...lines].map((row) => row.map(csvCell).join(",")).join("\n");
}
