import { useState, type ChangeEvent, type MouseEvent, type ReactNode } from "react";
import { usePharma } from "@/hooks";
import { EMPLOYEE_POSITIONS, employeeTenure, inr, monthlyPayroll, type Employee } from "@/utils";
import { formatDayText, toYmd } from "@/utils/date";
import {
  Avatar,
  Box,
  Button,
  Heading,
  Input,
  Pill,
  Progress,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import {
  IconBriefcase,
  IconCash,
  IconDoc,
  IconIdCard,
  IconPlus,
  IconPrint,
  IconRupee,
  IconSearch,
  IconUser,
  IconUsers,
} from "@/components/atoms";
import { Card, CardBody } from "@/components/molecules/Card";
import { initialsOf } from "@/components/molecules";
import { EmployeeForm } from "./components/EmployeeForm";
import { EmployeeIdCard } from "./components/EmployeeIdCard";
import {
  activeEmployeeCount,
  barPercent,
  countByPosition,
  countEmployment,
  documentTotals,
  downloadBlob,
  employeesCsv,
  filterEmployees,
} from "./Employees.utils";
import type { EmployeeDraft, EmployeeStatusFilter } from "./Employees.types";

export default function EmployeesScreen() {
  const { employees, addEmployee, updateEmployee, now, profile } = usePharma();
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("all");
  const [status, setStatus] = useState<EmployeeStatusFilter>("all");
  const [editing, setEditing] = useState<Employee | "new" | null>(null);
  const [idCardOf, setIdCardOf] = useState<Employee | null>(null);

  const rows = filterEmployees(employees, { query, position, status });
  const active = activeEmployeeCount(employees);
  const payroll = monthlyPayroll(employees);
  const averageSalary = active ? Math.round(payroll / active) : 0;
  const documents = documentTotals(employees);
  const byPosition = countByPosition(employees);
  const positionMax = Math.max(
    1,
    ...byPosition.map(function countOf(entry) {
      return entry[1];
    }),
  );
  const byType = countEmployment(employees);

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function handlePositionChange(event: ChangeEvent<HTMLSelectElement>) {
    setPosition(event.target.value);
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    setStatus(event.target.value as EmployeeStatusFilter);
  }

  function handleExport() {
    downloadBlob(
      new Blob(["\uFEFF" + employeesCsv(rows)], { type: "text/csv;charset=utf-8;" }),
      `employees-${toYmd(now)}.csv`,
    );
  }

  function handleAdd() {
    setEditing("new");
  }

  function handleClose() {
    setEditing(null);
  }

  function handleCloseCard() {
    setIdCardOf(null);
  }

  async function handleSave(draft: EmployeeDraft) {
    if (editing === "new") {
      const error = await addEmployee(draft);
      if (!error) setEditing(null);
      return;
    }
    if (!editing) return;
    const error = await updateEmployee(editing.id, draft);
    if (!error) setEditing(null);
  }

  function handleOpenCardFromForm() {
    if (!editing || editing === "new") return;
    setIdCardOf(editing);
    setEditing(null);
  }

  function fullTime(item: { employment: string }) {
    return item.employment === "Full-time";
  }
  function partTime(item: { employment: string }) {
    return item.employment === "Part-time";
  }
  function contract(item: { employment: string }) {
    return item.employment === "Contract";
  }
  return (
    <Box className="mx-auto max-w-[1680px]">
      <Stack direction="row" align="center" wrap gap={2} className="mb-4">
        <Select
          className="w-[170px]"
          value={position}
          onChange={handlePositionChange}
          aria-label="Position"
          options={[{ value: "all", label: "All positions" }, ...PositionOptions()]}
        />
        <Select
          className="w-[130px]"
          value={status}
          onChange={handleStatusChange}
          aria-label="Status"
          options={[
            { value: "all", label: "All status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
        <Stack
          direction="row"
          align="center"
          gap={2}
          className="min-w-[240px] max-w-[360px] flex-1 rounded-sm border border-line-2 bg-paper px-3 py-[10.5px]"
        >
          <Box className="text-green">
            <IconSearch size={17} />
          </Box>
          <Input
            variant="plain"
            aria-label="Search employees"
            placeholder="Search name, code, phone…"
            value={query}
            onChange={handleQueryChange}
            className="!py-0 placeholder:text-faint"
          />
        </Stack>
        <Box className="flex-1" />
        <Button variant="ghost" disabled={!rows.length} onClick={handleExport}>
          <IconPrint size={15} /> Export
        </Button>
        <Button variant="primary" onClick={handleAdd}>
          <IconPlus size={16} /> Add Employee
        </Button>
      </Stack>

      <Box className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-4">
        <StatCard
          tone="green"
          icon={<IconUsers size={18} />}
          label="Team size"
          value={String(employees.length)}
          hint={`${active} active · ${employees.length - active} inactive`}
        />
        <StatCard
          tone="blue"
          icon={<IconCash size={18} />}
          label="Monthly payroll"
          value={inr(payroll)}
          hint={`${inr(payroll * 12)}/yr`}
        />
        <StatCard
          tone="gold"
          icon={<IconRupee size={18} />}
          label="Avg salary"
          value={inr(averageSalary)}
          hint="per active staff"
        />
        <StatCard
          tone="green"
          icon={<IconDoc size={18} />}
          label="Documents on file"
          value={String(documents.total)}
          hint={`${documents.missing} staff with none`}
        />
        <StatCard
          tone="blue"
          icon={<IconBriefcase size={18} />}
          label="Full-time"
          value={String(byType.find(fullTime)?.count ?? 0)}
          hint={`${byType.find(partTime)?.count ?? 0} PT · ${byType.find(contract)?.count ?? 0} contract`}
        />
        <StatCard
          tone="gold"
          icon={<IconUser size={18} />}
          label="Positions"
          value={String(byPosition.length)}
          hint="roles across team"
        />
      </Box>

      <Card className="mb-4 rounded-md shadow-sm">
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="border-b border-line px-[18px] py-[15px]"
        >
          <Heading level={3} className="text-[15px] font-bold tracking-normal">
            Team composition
          </Heading>
          <Text className="text-[12.5px] text-muted">by role</Text>
        </Stack>
        <CardBody className="p-[18px]">
          <Box className="grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr]">
            <PositionBars rows={byPosition} max={positionMax} />
          </Box>
        </CardBody>
      </Card>

      <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
        <Box className="overflow-x-auto">
          <Table className="border-separate border-spacing-0 text-[13px] [&_tbody_tr:hover]:bg-wash-2 [&_td]:px-3.5 [&_td]:py-[11px] [&_td]:align-middle [&_td]:text-ink-2 [&_td.text-right]:font-semibold [&_td.text-right]:text-ink">
            <TableHead>
              <TableRow className="border-0">
                <HeaderCell>Code</HeaderCell>
                <HeaderCell>Employee</HeaderCell>
                <HeaderCell>Position</HeaderCell>
                <HeaderCell>Phone</HeaderCell>
                <HeaderCell>Joined</HeaderCell>
                <HeaderCell align="right">Salary / mo</HeaderCell>
                <HeaderCell>Docs</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>ID card</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <EmployeeRows rows={rows} now={now} onEdit={setEditing} onCard={setIdCardOf} />
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Stack align="center" className="px-5 py-9 text-center">
                      <Box className="mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-mid">
                        <IconUser size={28} />
                      </Box>
                      <Text variant="muted">
                        No employees match this filter. Add your first team member.
                      </Text>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {editing ? (
        <EmployeeForm
          initial={editing === "new" ? null : editing}
          onClose={handleClose}
          onSave={handleSave}
          now={now}
          onIdCard={editing === "new" ? undefined : handleOpenCardFromForm}
        />
      ) : null}
      {idCardOf ? (
        <EmployeeIdCard employee={idCardOf} profile={profile} onClose={handleCloseCard} />
      ) : null}
    </Box>
  );
}

function PositionOptions() {
  return EMPLOYEE_POSITIONS.map(renderPosition);
}

function renderPosition(position: string) {
  return { value: String(position), label: String(position) };
}

function HeaderCell({ children, align }: { children: string; align?: "right" }) {
  return (
    <TableHeaderCell
      align={align}
      className="sticky top-0 z-[1] whitespace-nowrap bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted"
    >
      {children}
    </TableHeaderCell>
  );
}

function PositionBars({ rows, max }: { rows: [string, number][]; max: number }) {
  function renderBar(entry: [string, number]) {
    return <PositionBar key={entry[0]} role={entry[0]} count={entry[1]} max={max} />;
  }
  return rows.map(renderBar);
}

function PositionBar({ role, count, max }: { role: string; count: number; max: number }) {
  return (
    <Stack gap={1} className="mb-[9px]">
      <Stack direction="row" justify="between">
        <Text as="span" className="text-[12.5px]">
          {role}
        </Text>
        <Text as="span" className="text-[12.5px] font-bold">
          {count}
        </Text>
      </Stack>
      <Progress className="h-[7px] rounded-[5px]" value={barPercent(count, max)} label={role} />
    </Stack>
  );
}

function EmployeeRows({
  rows,
  now,
  onEdit,
  onCard,
}: {
  rows: Employee[];
  now: number;
  onEdit: (employee: Employee) => void;
  onCard: (employee: Employee) => void;
}) {
  function renderEmployee(employee: Employee) {
    return (
      <EmployeeRow
        key={employee.id}
        employee={employee}
        now={now}
        onEdit={onEdit}
        onCard={onCard}
      />
    );
  }
  return rows.map(renderEmployee);
}

function EmployeeRow({
  employee,
  now,
  onEdit,
  onCard,
}: {
  employee: Employee;
  now: number;
  onEdit: (employee: Employee) => void;
  onCard: (employee: Employee) => void;
}) {
  function handleEdit() {
    onEdit(employee);
  }
  function handleCard(event: MouseEvent) {
    event.stopPropagation();
    onCard(employee);
  }
  return (
    <TableRow className="cursor-pointer !border-b-0 hover:bg-wash-2" onClick={handleEdit}>
      <TableCell className="px-3.5 py-[11px] font-mono font-bold">{employee.id}</TableCell>
      <TableCell className="px-3.5 py-[11px]">
        <Stack direction="row" align="center" gap={2}>
          <Avatar
            name={employee.name}
            src={employee.photo}
            initials={initialsOf(employee.name)}
            className="!h-[34px] !w-[34px] !rounded-[10px] !bg-mint !text-[13px] !leading-none !font-extrabold !tracking-[-0.02em] !text-deep"
          />
          <Text as="span" className="font-bold text-ink">
            {employee.name}
          </Text>
        </Stack>
      </TableCell>
      <TableCell className="px-3.5 py-[11px]">
        {employee.position}
        {employee.department ? (
          <Text as="span" variant="muted" className="text-[11.5px]">
            {" "}
            · {employee.department}
          </Text>
        ) : null}
      </TableCell>
      <TableCell className="whitespace-nowrap px-3.5 py-[11px]">{employee.phone}</TableCell>
      <TableCell className="whitespace-nowrap px-3.5 py-[11px]">
        {formatDayText(employee.joinedOn)}
        <Text variant="caption">{employeeTenure(employee.joinedOn, now)}</Text>
      </TableCell>
      <TableCell align="right" className="px-3.5 py-[11px] font-extrabold">
        {inr(employee.salary)}
      </TableCell>
      <TableCell className="px-3.5 py-[11px]">
        {employee.documents?.length ? (
          <Pill tone="gray">
            <IconDoc size={11} /> {employee.documents.length}
          </Pill>
        ) : (
          <Text as="span" variant="muted" title="No documents uploaded">
            —
          </Text>
        )}
      </TableCell>
      <TableCell className="px-3.5 py-[11px]">
        <Pill tone={employee.status === "active" ? "green" : "gray"}>
          {employee.status === "active" ? "Active" : "Inactive"}
        </Pill>
      </TableCell>
      <TableCell className="px-3.5 py-[11px]">
        <Button variant="ghost" size="sm" onClick={handleCard}>
          <IconIdCard size={14} /> ID card
        </Button>
      </TableCell>
    </TableRow>
  );
}

function StatCard({
  tone,
  icon,
  label,
  value,
  hint,
}: {
  tone: "green" | "blue" | "gold";
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  const toneClass = {
    green: "bg-wash text-mid",
    blue: "bg-blue-bg text-blue",
    gold: "bg-amber-bg text-gold-d",
  }[tone];
  return (
    <Stack className="rounded-md border border-line bg-paper px-[18px] py-4 shadow-sm">
      <Box className={`grid h-8 w-8 place-items-center rounded-[9px] ${toneClass}`}>{icon}</Box>
      <Text
        variant="label"
        className="mt-3 text-[11px] font-bold uppercase tracking-[0.05em] text-muted"
      >
        {label}
      </Text>
      <Text className="mb-2.5 mt-[3px] font-display text-[26px] font-extrabold tracking-[-0.03em] text-dark tabular-nums">
        {value}
      </Text>
      <Text variant="caption" className="mt-auto border-t border-line pt-[9px] text-[12px]">
        {hint}
      </Text>
    </Stack>
  );
}
