import { useState, type ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { problemMessage, useAuthState } from "@/features/authentication";
import { EmployeeForm } from "../../components/EmployeeForm";
import { EmployeeIdCard } from "../../components/EmployeeIdCard";
import {
  useCreateEmployeeMutation,
  useListEmployeesQuery,
  useUpdateEmployeeMutation,
} from "../../employees.api";
import {
  POSITIONS,
  activeEmployeeCount,
  barPercent,
  countByPosition,
  documentTotals,
  employeeAccess,
  employeeTenure,
  employeesCsv,
  employmentCount,
  filterEmployees,
  formatDayText,
  inr,
  monthlyPayroll,
  payload,
  toFormData,
  type Employee,
  type EmployeeDraft,
  type PendingDocument,
} from "../../model";

export function EmployeesPage() {
  const { session } = useAuthState();
  const access = employeeAccess(session?.account.pharmacyRole, session?.account.permissions);
  const list = useListEmployeesQuery();
  const [createEmployee, created] = useCreateEmployeeMutation();
  const [updateEmployee, updated] = useUpdateEmployeeMutation();
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Employee | "new" | null>(null);
  const [idCardOf, setIdCardOf] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const employees = list.data?.employees ?? [];
  const workplace = list.data?.workplace;
  const rows = filterEmployees(employees, { query, position, status });
  const active = activeEmployeeCount(employees);
  const payroll = monthlyPayroll(employees);
  const average = active ? Math.round(payroll / active) : 0;
  const documents = documentTotals(employees);
  const byPosition = countByPosition(employees);
  const positionMax = Math.max(1, ...byPosition.map((entry) => entry[1]));
  const now = Date.now();

  async function save(
    draft: EmployeeDraft,
    photo: File | null,
    removePhoto: boolean,
    pending: PendingDocument[],
  ) {
    setError(null);
    const current = editing !== "new" && editing ? editing : null;
    const onlyInactive =
      current &&
      !access.update &&
      access.inactivate &&
      draft.status === "inactive" &&
      current.status !== "inactive";
    const body = onlyInactive
      ? { status: "inactive" as const }
      : photo || removePhoto || pending.length
        ? toFormData(draft, photo, removePhoto, pending)
        : payload(draft, removePhoto);
    const result = current
      ? await updateEmployee({
          code: current.id,
          body: onlyInactive ? { status: "inactive" } : body,
        })
      : await createEmployee(body as ReturnType<typeof payload>);
    if ("error" in result) {
      setError(problemMessage(result.error, "Could not save this employee"));
      return;
    }
    setEditing(null);
  }

  function exportCsv() {
    const blob = new Blob(["\uFEFF" + employeesCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "employees.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (list.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading employees</Text>;
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      {list.isError ? (
        <Text className="mb-3 text-[12.5px] font-bold text-rose">
          {problemMessage(list.error, "Could not load employees")}
        </Text>
      ) : null}
      <Stack direction="row" align="center" wrap className="mb-4 gap-2">
        <select
          aria-label="Position"
          className="w-[170px] rounded-sm border border-line-2 bg-paper px-3 py-[10.5px] text-[13px]"
          value={position}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setPosition(event.target.value)}
        >
          <option value="all">All positions</option>
          {POSITIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          aria-label="Status"
          className="w-[130px] rounded-sm border border-line-2 bg-paper px-3 py-[10.5px] text-[13px]"
          value={status}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatus(event.target.value)}
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Stack
          direction="row"
          align="center"
          className="min-w-[240px] max-w-[360px] flex-1 gap-2 rounded-sm border border-line-2 bg-paper px-3 py-[10.5px]"
        >
          <Input
            variant="plain"
            aria-label="Search employees"
            placeholder="Search name, code, phone…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="!py-0"
          />
        </Stack>
        <Box className="flex-1" />
        <Button type="button" variant="ghost" disabled={!rows.length} onClick={exportCsv}>
          Export
        </Button>
        {access.create ? (
          <Button
            type="button"
            onClick={() => {
              setError(null);
              setEditing("new");
            }}
          >
            Add Employee
          </Button>
        ) : null}
      </Stack>

      <Box className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-4">
        <Stat
          label="Team size"
          value={String(employees.length)}
          hint={`${active} active · ${employees.length - active} inactive`}
        />
        <Stat label="Monthly payroll" value={inr(payroll)} hint={`${inr(payroll * 12)}/yr`} />
        <Stat label="Avg salary" value={inr(average)} hint="per active staff" />
        <Stat
          label="Documents on file"
          value={String(documents.total)}
          hint={`${documents.missing} staff with none`}
        />
        <Stat
          label="Full-time"
          value={String(employmentCount(employees, "Full-time"))}
          hint={`${employmentCount(employees, "Part-time")} PT · ${employmentCount(employees, "Contract")} contract`}
        />
        <Stat label="Positions" value={String(byPosition.length)} hint="roles across team" />
      </Box>

      <Box className="mb-4 rounded-md border border-line bg-paper shadow-sm">
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="border-b border-line px-[18px] py-[15px]"
        >
          <Heading level={3} className="text-[15px]">
            Team composition
          </Heading>
          <Text className="text-[12.5px] text-muted">by role</Text>
        </Stack>
        <Box className="p-[18px]">
          {byPosition.map(([role, count]) => (
            <Stack key={role} className="mb-[9px] gap-1">
              <Stack direction="row" justify="between">
                <Text className="text-[12.5px]">{role}</Text>
                <Text className="text-[12.5px] font-bold">{count}</Text>
              </Stack>
              <Box className="h-[7px] overflow-hidden rounded-[5px] bg-wash">
                <Box
                  className="h-full bg-mid"
                  style={{ width: `${barPercent(count, positionMax)}%` }}
                />
              </Box>
            </Stack>
          ))}
        </Box>
      </Box>

      <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
        <Box className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                {[
                  "Code",
                  "Employee",
                  "Position",
                  "Phone",
                  "Joined",
                  "Salary / mo",
                  "Docs",
                  "Status",
                  "ID card",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((employee) => (
                <tr
                  key={employee.id}
                  className="cursor-pointer hover:bg-wash-2"
                  onClick={() => {
                    setError(null);
                    setEditing(employee);
                  }}
                >
                  <td className="px-3.5 py-[11px] font-mono font-bold">{employee.id}</td>
                  <td className="px-3.5 py-[11px] font-bold">{employee.name}</td>
                  <td className="px-3.5 py-[11px]">
                    {employee.position}
                    {employee.department ? (
                      <Text as="span" variant="muted">
                        {" "}
                        · {employee.department}
                      </Text>
                    ) : null}
                  </td>
                  <td className="px-3.5 py-[11px]">{employee.phone}</td>
                  <td className="px-3.5 py-[11px]">
                    {formatDayText(employee.joinedOn || "")}
                    <Text variant="caption">{employeeTenure(employee.joinedOn || "", now)}</Text>
                  </td>
                  <td className="px-3.5 py-[11px] text-right font-extrabold">
                    {inr(employee.salary)}
                  </td>
                  <td className="px-3.5 py-[11px]">{employee.documents.length || "—"}</td>
                  <td className="px-3.5 py-[11px]">
                    {employee.status === "active" ? "Active" : "Inactive"}
                  </td>
                  <td className="px-3.5 py-[11px]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIdCardOf(employee);
                      }}
                    >
                      ID card
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-9 text-center text-muted">
                    No employees match this filter. Add your first team member.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Box>
      </Box>

      {editing ? (
        <EmployeeForm
          employee={editing === "new" ? null : editing}
          access={access}
          saving={created.isLoading || updated.isLoading}
          error={error}
          onClose={() => setEditing(null)}
          onSave={(draft, photo, removePhoto, pending) =>
            void save(draft, photo, removePhoto, pending)
          }
          onIdCard={
            editing === "new"
              ? undefined
              : () => {
                  setIdCardOf(editing);
                  setEditing(null);
                }
          }
        />
      ) : null}
      {idCardOf && workplace ? (
        <EmployeeIdCard
          employee={idCardOf}
          workplace={workplace}
          onClose={() => setIdCardOf(null)}
        />
      ) : null}
    </Box>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Stack className="rounded-md border border-line bg-paper px-[18px] py-4 shadow-sm">
      <Text variant="label" className="mt-3 uppercase">
        {label}
      </Text>
      <Text className="font-display text-[26px] font-extrabold text-dark">{value}</Text>
      <Text variant="caption" className="mt-auto border-t border-line pt-[9px]">
        {hint}
      </Text>
    </Stack>
  );
}
