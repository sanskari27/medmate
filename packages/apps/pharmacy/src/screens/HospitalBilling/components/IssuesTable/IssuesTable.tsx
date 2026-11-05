import { useState } from "react";
import { usePharma } from "@/store/slices/session";
import { inr, fmtDateTime } from "@/utils";
import { WardSupplyReason, reasonMeta, WardSupply } from "@/utils/calculations/hospitalAccount";
import { IconSearch, IconHospital, IconReceipt } from "@/components/Icon";
import WardSupplyInvoice from "@/screens/HospitalBilling/components/WardSupplyInvoice";

import { supplyToInvoice } from "@/screens/HospitalBilling/components/supplyToInvoice";

const REASON_TONE: Record<WardSupplyReason, string> = {
  floor: "pill-blue",
  consumption: "pill-gold",
  refill: "pill-teal",
};

export function IssuesTable() {
  const { wardSupplies, wards, profile, hospitalAccount } = usePharma();
  const [inv, setInv] = useState<WardSupply | null>(null);
  const [q, setQ] = useState("");
  const [wardId, setWardId] = useState("all");
  const [kind, setKind] = useState<"all" | "issue" | "return" | "refill">("all");
  const ql = q.trim().toLowerCase();
  const rows = [...wardSupplies]
    .filter((s) => {
      if (wardId !== "all" && s.wardId !== wardId) return false;
      if (kind === "issue" && s.kind !== "issue") return false;
      if (kind === "return" && s.kind !== "return") return false;
      if (kind === "refill" && !(s.kind === "issue" && s.reason === "refill")) return false;
      if (
        ql &&
        !`${s.id} ${s.wardName} ${s.patientId ?? ""} ${s.patientName ?? ""} ${s.refDoc ?? ""} ${s.items.map((i) => i.name).join(" ")}`
          .toLowerCase()
          .includes(ql)
      )
        return false;
      return true;
    })
    .sort((a, b) => b.at - a.at);
  const shownTotal =
    rows.filter((s) => s.kind === "issue").reduce((a, s) => a + s.total, 0) -
    rows.filter((s) => s.kind === "return").reduce((a, s) => a + s.total, 0);
  return (
    <>
      <div className="pd-toolbar" style={{ marginBottom: 12 }}>
        <div className="pd-search-inline">
          <span className="ic">
            <IconSearch size={16} />
          </span>
          <input
            placeholder="Search ref, ward, patient, medicine…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="pd-select" value={wardId} onChange={(e) => setWardId(e.target.value)}>
          <option value="all">All wards</option>
          {wards.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <div className="pd-seg">
          {(["all", "issue", "refill", "return"] as const).map((k) => (
            <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
              {k === "all"
                ? "All"
                : k === "issue"
                  ? "Issues"
                  : k === "refill"
                    ? "Refills"
                    : "Returns"}
            </button>
          ))}
        </div>
        <div className="pd-spacer" />
        <span className="pd-muted" style={{ fontSize: 12.5 }}>
          {rows.length} row{rows.length !== 1 ? "s" : ""} · net {inr(shownTotal)}
        </span>
      </div>
      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Date</th>
                <th>Ward</th>
                <th>Reason</th>
                <th>Patient (refill)</th>
                <th>Items</th>
                <th className="num">Amount</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="pd-mono" style={{ fontWeight: 700 }}>
                    {s.id}
                    {s.refDoc ? (
                      <div className="pd-muted" style={{ fontSize: 11 }}>
                        {s.refDoc}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(s.at)}</td>
                  <td>{s.wardName}</td>
                  <td>
                    {s.kind === "return" ? (
                      <span className="pd-pill pill-gray">Return</span>
                    ) : (
                      <span className={`pd-pill ${REASON_TONE[s.reason]}`}>
                        {reasonMeta(s.reason).tag}
                      </span>
                    )}
                  </td>
                  <td>
                    {s.patientId ? (
                      <span className="pd-mono" style={{ fontSize: 12 }}>
                        {s.patientId}
                        <div className="pd-muted" style={{ fontWeight: 500 }}>
                          {s.patientName}
                        </div>
                      </span>
                    ) : (
                      <span className="pd-muted">—</span>
                    )}
                  </td>
                  <td>
                    {s.items.length}
                    <div className="pd-muted" style={{ fontSize: 11 }}>
                      {s.items
                        .map((i) => `${i.name}×${i.qty}`)
                        .join(", ")
                        .slice(0, 40)}
                    </div>
                  </td>
                  <td
                    className="num"
                    style={{
                      fontWeight: 800,
                      color: s.kind === "return" ? "var(--mid)" : "var(--ink)",
                    }}
                  >
                    {s.kind === "return" ? "−" : ""}
                    {inr(s.total)}
                  </td>
                  <td>
                    {s.kind === "issue" ? (
                      <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={() => setInv(s)}>
                        <IconReceipt size={13} /> View
                      </button>
                    ) : (
                      <span className="pd-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="pd-empty">
                      <div className="em">
                        <IconHospital size={28} />
                      </div>
                      <p>No ward issues yet — create one with “New ward issue”.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {inv && (
            <WardSupplyInvoice
              data={supplyToInvoice(inv)}
              profile={profile}
              account={hospitalAccount}
              onClose={() => setInv(null)}
            />
          )}
        </div>
      </div>
    </>
  );
}
