import { ymd } from "./ymd";
import { fmtDay } from "./fmtDay";
import { csvCell } from "./csvCell";
import { download } from "./download";
import { EmployeeForm } from "./EmployeeForm";
import { useMemo, useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  inr,
  Employee,
  EMPLOYEE_POSITIONS,
  EMPLOYMENT_TYPES,
  employeeTenure,
  monthlyPayroll,
} from "@/domain";
import {
  IconPlus,
  IconSearch,
  IconPrint,
  IconIdCard,
  IconUser,
  IconUsers,
  IconCash,
  IconRupee,
  IconDoc,
  IconBriefcase,
} from "@/components/Icon";
import { Avatar } from "@/components/entityIcon";
import EmployeeIdCard from "@/features/employees/EmployeeIdCard";

export default function EmployeesScreen() {
  const { employees, addEmployee, updateEmployee, now, profile } = usePharma();
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<Employee | "new" | null>(null);
  const [idCardOf, setIdCardOf] = useState<Employee | null>(null);

  const rows = useMemo(
    () =>
      employees
        .filter((e) => pos === "all" || e.position === pos)
        .filter((e) => status === "all" || e.status === status)
        .filter(
          (e) =>
            !q.trim() ||
            `${e.id} ${e.name} ${e.position} ${e.phone} ${e.department ?? ""}`
              .toLowerCase()
              .includes(q.toLowerCase()),
        )
        .sort((a, b) => a.id.localeCompare(b.id)),
    [employees, pos, status, q],
  );

  const active = employees.filter((e) => e.status === "active").length;
  const payroll = monthlyPayroll(employees);
  const avgSalary = active ? Math.round(payroll / active) : 0;
  const totalDocs = employees.reduce((a, e) => a + (e.documents?.length ?? 0), 0);
  const missingDocs = employees.filter((e) => (e.documents?.length ?? 0) === 0).length;
  // team composition by position
  const byPosition = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of employees) m.set(e.position, (m.get(e.position) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [employees]);
  const posMax = Math.max(1, ...byPosition.map(([, n]) => n));
  const byType = EMPLOYMENT_TYPES.map((t) => ({
    t,
    n: employees.filter((e) => e.employment === t).length,
  }));

  const exportCsv = () => {
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
    const lines = rows.map((e) => [
      e.id,
      e.name,
      e.position,
      e.department ?? "",
      e.employment,
      e.status,
      e.phone,
      e.email ?? "",
      e.dob ?? "",
      e.joinedOn,
      e.salary,
      e.pan ?? "",
      e.aadhaar ?? "",
      e.bankName ?? "",
      e.accountName ?? "",
      e.accountNumber ?? "",
      e.ifsc ?? "",
      e.upi ?? "",
      e.emergencyName ? `${e.emergencyName} ${e.emergencyPhone ?? ""}` : "",
      e.address ?? "",
    ]);
    const csv = [head, ...lines].map((r) => r.map(csvCell).join(",")).join("\n");
    download(
      new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }),
      `employees-${ymd(now)}.csv`,
    );
  };

  return (
    <div className="pd-canvas-wide">
      <div className="pd-toolbar">
        <select
          className="pd-select"
          style={{ width: 170 }}
          value={pos}
          onChange={(e) => setPos(e.target.value)}
        >
          <option value="all">All positions</option>
          {EMPLOYEE_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="pd-select"
          style={{ width: 130 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="pd-search-inline">
          <span className="ic">
            <IconSearch size={17} />
          </span>
          <input
            placeholder="Search name, code, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="pd-spacer" />
        <button className="pd-btn pd-btn-ghost" disabled={!rows.length} onClick={exportCsv}>
          <IconPrint size={15} /> Export
        </button>
        <button className="pd-btn pd-btn-primary" onClick={() => setEditing("new")}>
          <IconPlus size={16} /> Add Employee
        </button>
      </div>

      <div className="pd-stats">
        <div className="pd-stat">
          <div className="ic ic-green">
            <IconUsers size={18} />
          </div>
          <div className="lbl">Team size</div>
          <div className="val">{employees.length}</div>
          <div className="split">
            {active} active · {employees.length - active} inactive
          </div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-blue">
            <IconCash size={18} />
          </div>
          <div className="lbl">Monthly payroll</div>
          <div className="val">{inr(payroll)}</div>
          <div className="split">{inr(payroll * 12)}/yr</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-gold">
            <IconRupee size={18} />
          </div>
          <div className="lbl">Avg salary</div>
          <div className="val">{inr(avgSalary)}</div>
          <div className="split">per active staff</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-green">
            <IconDoc size={18} />
          </div>
          <div className="lbl">Documents on file</div>
          <div className="val">{totalDocs}</div>
          <div className="split">{missingDocs} staff with none</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-blue">
            <IconBriefcase size={18} />
          </div>
          <div className="lbl">Full-time</div>
          <div className="val">{byType.find((x) => x.t === "Full-time")?.n ?? 0}</div>
          <div className="split">
            {byType.find((x) => x.t === "Part-time")?.n ?? 0} PT ·{" "}
            {byType.find((x) => x.t === "Contract")?.n ?? 0} contract
          </div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-gold">
            <IconUser size={18} />
          </div>
          <div className="lbl">Positions</div>
          <div className="val">{byPosition.length}</div>
          <div className="split">roles across team</div>
        </div>
      </div>

      <div className="pd-card" style={{ marginBottom: 16 }}>
        <div className="pd-card-head">
          <h3>Team composition</h3>
          <span className="sub">by role</span>
        </div>
        <div className="pd-card-pad">
          <div className="pd-grid-2">
            {byPosition.map(([role, n]) => (
              <div key={role} style={{ marginBottom: 9 }}>
                <div
                  className="pd-flex"
                  style={{ justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}
                >
                  <span>{role}</span>
                  <b>{n}</b>
                </div>
                <div className="pd-prog">
                  <i style={{ width: `${(n / posMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Code</th>
                <th>Employee</th>
                <th>Position</th>
                <th>Phone</th>
                <th>Joined</th>
                <th className="num">Salary / mo</th>
                <th>Docs</th>
                <th>Status</th>
                <th>ID card</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => setEditing(e)}>
                  <td className="pd-mono" style={{ fontWeight: 700 }}>
                    {e.id}
                  </td>
                  <td>
                    <div className="prod">
                      <span className="em" style={{ overflow: "hidden" }}>
                        <Avatar name={e.name} photo={e.photo} size={34} />
                      </span>
                      <span className="nm">{e.name}</span>
                    </div>
                  </td>
                  <td>
                    {e.position}
                    {e.department ? (
                      <span className="pd-muted" style={{ fontSize: 11.5 }}>
                        {" "}
                        · {e.department}
                      </span>
                    ) : null}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{e.phone}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {fmtDay(e.joinedOn)}
                    <div className="pd-muted" style={{ fontSize: 11 }}>
                      {employeeTenure(e.joinedOn, now)}
                    </div>
                  </td>
                  <td className="num" style={{ fontWeight: 800 }}>
                    {inr(e.salary)}
                  </td>
                  <td>
                    {e.documents?.length ? (
                      <span className="pd-pill pill-gray">
                        <IconDoc size={11} /> {e.documents.length}
                      </span>
                    ) : (
                      <span className="pd-muted" title="No documents uploaded">
                        —
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`pd-pill ${e.status === "active" ? "pill-green" : "pill-gray"}`}
                    >
                      {e.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="pd-btn pd-btn-ghost pd-btn-sm"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setIdCardOf(e);
                      }}
                    >
                      <IconIdCard size={14} /> ID card
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="pd-empty">
                      <div className="em">
                        <IconUser size={28} />
                      </div>
                      <p>No employees match this filter. Add your first team member.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EmployeeForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (data) => {
            const err =
              editing === "new" ? await addEmployee(data) : await updateEmployee(editing.id, data);
            if (!err) setEditing(null);
          }}
          now={now}
          onIdCard={
            editing !== "new"
              ? () => {
                  setIdCardOf(editing as Employee);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}

      {idCardOf && (
        <EmployeeIdCard emp={idCardOf} profile={profile} onClose={() => setIdCardOf(null)} />
      )}
    </div>
  );
}
