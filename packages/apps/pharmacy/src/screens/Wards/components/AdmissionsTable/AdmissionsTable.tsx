import { useState } from "react";
import { inr, timeAgo, Sale } from "@/utils";
import { Admission } from "@/utils/calculations/hospital";
import { IconSearch, IconArrowRight } from "@/components/Icon";

import { billTotal } from "@/screens/Wards/components/billTotal";
import { daysIn } from "@/screens/Wards/components/daysIn";

export function AdmissionsTable({
  admissions,
  sales,
  now,
  onOpen,
}: {
  admissions: Admission[];
  sales: Sale[];
  now: number;
  onOpen: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const rows = admissions.filter(
    (a) =>
      !q.trim() ||
      `${a.name} ${a.patientId} ${a.bed} ${a.wardName} ${a.doctor}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  const outstandingOf = (a: Admission) =>
    sales
      .filter((s) => s.patientId === a.patientId && s.status !== "cancelled" && s.paid === false)
      .reduce((x, s) => x + billTotal(s), 0);

  return (
    <div className="pd-card" style={{ marginTop: 16 }}>
      <div className="pd-card-head">
        <h3>Admitted patients</h3>
        <div className="pd-search-inline">
          <span className="ic">
            <IconSearch size={16} />
          </span>
          <input
            placeholder="Patient, UHID, bed…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      <div className="pd-tbl-wrap">
        <table className="pd-tbl">
          <thead>
            <tr>
              <th>Patient</th>
              <th>UHID</th>
              <th>Ward · Bed</th>
              <th>Doctor</th>
              <th>Payer</th>
              <th>Admitted</th>
              <th className="num">Outstanding</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => onOpen(a.id)}>
                <td>
                  <b>{a.name}</b>
                  <div className="pd-muted" style={{ fontSize: 11 }}>
                    {a.gender}
                    {a.age ? ` · ${a.age}y` : ""}
                  </div>
                </td>
                <td className="pd-mono">{a.patientId}</td>
                <td>
                  {a.wardName}
                  <div className="pd-muted pd-mono" style={{ fontSize: 11 }}>
                    {a.bed}
                  </div>
                </td>
                <td>{a.doctor || "—"}</td>
                <td>
                  {a.payerType === "insurance" ? (
                    <span className="pd-pill pill-blue">{a.insurer ?? "Insurance"}</span>
                  ) : (
                    <span className="pd-pill pill-gray">Self-pay</span>
                  )}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {daysIn(a.admittedAt, now)}d · {timeAgo(a.admittedAt, now)}
                </td>
                <td
                  className="num"
                  style={{
                    fontWeight: 800,
                    color: outstandingOf(a) > 0 ? "var(--rose)" : "var(--mid)",
                  }}
                >
                  {inr(outstandingOf(a))}
                </td>
                <td>
                  <IconArrowRight size={15} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="pd-empty">No admitted patients.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
