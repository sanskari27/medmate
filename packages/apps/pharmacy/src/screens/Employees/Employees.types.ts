import type { Employee } from "@/utils";

export type EmployeeStatusFilter = "all" | "active" | "inactive";

export type EmployeeFilters = {
  query: string;
  position: string;
  status: EmployeeStatusFilter;
};

export type EmployeeDraft = Omit<Employee, "id">;
