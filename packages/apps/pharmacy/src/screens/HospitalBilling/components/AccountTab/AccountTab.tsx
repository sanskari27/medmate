import { useState, useMemo } from "react";
import { usePharma } from "@/store/slices/session";
import { inr, fmtDateTime } from "@/utils";
import {
  CreditTerms,
  CREDIT_TERMS,
  buildStatement,
  termDays,
  hospitalAging,
} from "@/utils/calculations/hospitalAccount";
import { IconReports, IconPrint, IconTag, IconAlert, IconSend, IconCheck } from "@/components/Icon";
import { buildReportPdf } from "@/utils/pdf";
import { useDateRange } from "@/components/DateRangeField";

import { download } from "@/screens/HospitalBilling/components/download";

type LineType = "all" | "issue" | "return" | "payment";

const LINE_FILTERS: { k: LineType; label: string }[] = [
  { k: "all", label: "All" },
  { k: "issue", label: "Supplied" },
  { k: "return", label: "Returns" },
  { k: "payment", label: "Payments" },
];

export function AccountTab({
  outstanding,
  aging,
  onRemind,
}: {
  outstanding: number;
  supplied: number;
  returns: number;
  received: number;
  aging: ReturnType<typeof hospitalAging>;
  onRemind: () => void;
}) {
  const {
    hospitalAccount: a,
    updateHospitalAccount,
    wardSupplies,
    hospitalPayments,
    profile,
    now,
  } = usePharma();
  const limit = a.creditLimit || 0;
  const util = limit > 0 ? Math.min(100, Math.round((outstanding / limit) * 100)) : 0;
  const lines = useMemo(
    () => buildStatement(wardSupplies, hospitalPayments),
    [wardSupplies, hospitalPayments],
  );
  const dueDays = termDays(a.creditTerms);

  // standard date-range filter (+ entry-type filter) over the statement
  const period = useDateRange(now, "last-365");
  const [tf, setTf] = useState<LineType>("all");
  const shown = useMemo(
    () => lines.filter((l) => period.inWindow(l.at) && (tf === "all" || l.type === tf)),
    [lines, period, tf],
  );
  const prior = lines.filter((l) => !period.inWindow(l.at) && l.at < (shown[0]?.at ?? Infinity));
  const opening = prior.length ? prior[prior.length - 1].balance : 0;
  const periodDebit = shown.reduce((s, l) => s + l.debit, 0);
  const periodCredit = shown.reduce((s, l) => s + l.credit, 0);
  const closing = shown.length ? shown[shown.length - 1].balance : opening;

  const exportCsv = () => {
    const head = ["Date", "Ref", "Particulars", "Patient ref", "Debit", "Credit", "Balance"];
    const body = shown.map((l) => [
      fmtDateTime(l.at),
      l.ref,
      l.label,
      a.flagRefills && l.patientId ? `${l.patientId} ${l.patientName ?? ""}` : "",
      l.debit || "",
      l.credit || "",
      l.balance,
    ]);
    const rows = [
      ["", "", `Opening balance · ${period.label}`, "", "", "", opening],
      ...body,
      ["", "", "Closing balance", "", periodDebit, periodCredit, closing],
    ];
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    download(
      new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }),
      "hospital-credit-statement.csv",
    );
  };
  const exportPdf = () => {
    const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));
    const headerLine =
      "Date              Ref       Particulars                    Debit      Credit     Balance";
    const rowLines = [
      `${pad("Opening balance", 57)}${("Rs " + Math.round(opening)).padStart(11)}`,
      ...shown.map(
        (l) =>
          `${pad(fmtDateTime(l.at), 17)} ${pad(l.ref, 9)} ${pad(l.label + (a.flagRefills && l.patientId ? ` [${l.patientId}]` : ""), 30)} ${(l.debit ? "Rs " + Math.round(l.debit) : "").padStart(10)} ${(l.credit ? "Rs " + Math.round(l.credit) : "").padStart(10)} ${("Rs " + Math.round(l.balance)).padStart(11)}`,
      ),
    ];
    download(
      buildReportPdf({
        title: "Hospital Credit Statement",
        subtitle: `${a.name} · ${period.label}${tf !== "all" ? " · " + LINE_FILTERS.find((x) => x.k === tf)!.label : ""} · terms ${a.creditTerms}`,
        generatedAt: fmtDateTime(now),
        profile,
        headerLine,
        rowLines,
        totalsLine: `Period debit Rs ${Math.round(periodDebit)}   credit Rs ${Math.round(periodCredit)}   ·   CLOSING BALANCE Rs ${Math.round(closing)}`,
      }),
      "hospital-credit-statement.pdf",
    );
  };

  return (
    <div className="pd-grid-2">
      <div className="pd-card pd-card-pad">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Hospital account</h3>
        <div className="pd-form-grid">
          <div className="pd-field pd-span2">
            <label>Hospital / institution name</label>
            <input
              className="pd-input"
              value={a.name}
              onChange={(e) => updateHospitalAccount({ name: e.target.value })}
            />
          </div>
          <div className="pd-field" data-field="gstin">
            <label>GSTIN</label>
            <input
              className="pd-input pd-mono"
              value={a.gstin}
              onChange={(e) => updateHospitalAccount({ gstin: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="pd-field">
            <label>Stores contact</label>
            <input
              className="pd-input"
              value={a.contact}
              onChange={(e) => updateHospitalAccount({ contact: e.target.value })}
            />
          </div>
          <div className="pd-field" data-field="phone">
            <label>Billing phone</label>
            <input
              className="pd-input"
              value={a.phone ?? ""}
              onChange={(e) => updateHospitalAccount({ phone: e.target.value })}
              placeholder="+91 "
            />
          </div>
          <div className="pd-field">
            <label>Billing email</label>
            <input
              className="pd-input"
              value={a.email ?? ""}
              onChange={(e) => updateHospitalAccount({ email: e.target.value })}
            />
          </div>
          <div className="pd-field">
            <label>Credit terms</label>
            <select
              className="pd-select"
              value={a.creditTerms}
              onChange={(e) =>
                updateHospitalAccount({ creditTerms: e.target.value as CreditTerms })
              }
            >
              {CREDIT_TERMS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="pd-field">
            <label>Credit limit ₹</label>
            <input
              className="pd-input"
              type="number"
              min={0}
              value={a.creditLimit}
              onChange={(e) =>
                updateHospitalAccount({ creditLimit: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </div>
          <div className="pd-field pd-span2">
            <label>Institutional discount</label>
            <input
              className="pd-input"
              value={`${a.discountPct}% off MRP · managed in Price list`}
              readOnly
              style={{ background: "var(--wash2)", color: "var(--muted)" }}
            />
          </div>
        </div>
        {/* credit-limit utilisation + aging */}
        {limit > 0 && (
          <>
            <div className={`pd-util${util >= 85 ? " near" : ""}`} style={{ marginTop: 14 }}>
              <span style={{ width: `${util}%` }} />
            </div>
            <div className="pd-hb-utilrow">
              <span>
                {inr(outstanding)} of {inr(limit)} limit
              </span>
              <b>
                {util}% used · {inr(Math.max(0, limit - outstanding))} free
              </b>
            </div>
          </>
        )}
        <div className="pd-hb-agingline">
          {aging.overdue > 0 ? (
            <span className="over">
              <IconAlert size={13} /> {inr(aging.overdue)} overdue
              {aging.overdueDays > 0 ? ` · ${aging.overdueDays}d past due` : ""}
            </span>
          ) : (
            <span className="ok">
              <IconCheck size={13} /> Nothing overdue
            </span>
          )}
          <button className="pd-btn pd-btn-line pd-btn-sm" onClick={onRemind}>
            <IconSend size={13} /> Send reminder
          </button>
        </div>
        <div className="pd-feat" style={{ marginTop: 12 }}>
          <span className="ico">
            <IconTag size={16} />
          </span>
          <div className="gw">
            <div className="t">Flag refill lines on statement</div>
            <div className="s">
              Show the patient ID/name on PATIENT_REFILL lines so the hospital can recover from the
              patient
            </div>
          </div>
          <button
            className={`pd-switch${a.flagRefills ? " on" : ""}`}
            onClick={() => updateHospitalAccount({ flagRefills: !a.flagRefills })}
          />
        </div>
      </div>

      <div className="pd-card">
        <div className="pd-card-head" style={{ flexWrap: "wrap", gap: 8 }}>
          <div>
            <h3>Credit statement</h3>
            <span className="pd-muted" style={{ fontSize: 12 }}>
              {dueDays ? `Net ${dueDays} days` : "Due on demand"} · {shown.length} entr
              {shown.length === 1 ? "y" : "ies"}
            </span>
          </div>
          <div className="pd-flex pd-gap6">
            <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={exportCsv}>
              <IconReports size={14} /> Excel
            </button>
            <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={exportPdf}>
              <IconPrint size={14} /> PDF
            </button>
          </div>
        </div>
        {/* standard filter */}
        <div
          className="pd-card-pad"
          style={{
            paddingTop: 12,
            paddingBottom: 0,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {period.node}
          <div className="pd-seg">
            {LINE_FILTERS.map((x) => (
              <button key={x.k} className={tf === x.k ? "on" : ""} onClick={() => setTf(x.k)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
        {/* period summary */}
        <div className="pd-card-pad" style={{ paddingTop: 12, paddingBottom: 8 }}>
          <div className="pd-summary-chips">
            <div className="pd-schip">
              Opening<b>{inr(opening)}</b>
            </div>
            <div className="pd-schip">
              Supplied (debit)<b>{inr(periodDebit)}</b>
            </div>
            <div className="pd-schip">
              Returns + paid (credit)<b>{inr(periodCredit)}</b>
            </div>
            <div className="pd-schip">
              Closing
              <b style={{ color: closing > 0 ? "var(--rose)" : "var(--mid)" }}>{inr(closing)}</b>
            </div>
          </div>
        </div>
        <div className="pd-tbl-wrap" style={{ maxHeight: 320, overflowY: "auto" }}>
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Particulars</th>
                <th className="num">Debit</th>
                <th className="num">Credit</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {[...shown].reverse().map((l, i) => (
                <tr key={l.ref + i}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {fmtDateTime(l.at)}
                    <div className="pd-muted pd-mono" style={{ fontSize: 10.5 }}>
                      {l.ref}
                    </div>
                  </td>
                  <td>
                    {l.label}
                    {a.flagRefills && l.patientId && (
                      <div className="pd-pill pill-teal" style={{ marginTop: 3, fontSize: 10 }}>
                        recover from {l.patientId} · {l.patientName}
                      </div>
                    )}
                  </td>
                  <td className="num">{l.debit ? inr(l.debit) : "—"}</td>
                  <td className="num" style={{ color: "var(--mid)" }}>
                    {l.credit ? inr(l.credit) : "—"}
                  </td>
                  <td className="num" style={{ fontWeight: 800 }}>
                    {inr(l.balance)}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="pd-empty">No transactions in this period.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
