import { useState, useMemo } from "react";
import { usePharma } from "@/hooks";
import { inr, fmtDateTime, PayMode, PAY_LABEL } from "@/utils";
import { Admission } from "@/utils/calculations/hospital";
import { IconX, IconRupee, IconPos, IconCheck } from "@/components/Icon";

import { billTotal } from "@/screens/Wards/utils/billTotal";
import { daysIn } from "@/screens/Wards/utils/daysIn";

const SETTLE_MODES: PayMode[] = ["cash", "upi", "card", "insurance"];

export function AdmissionModal({ adm, onClose }: { adm: Admission; onClose: () => void }) {
  const { sales, now, settleBills, dischargePatient, startWardBilling } = usePharma();
  const bills = useMemo(
    () =>
      sales
        .filter((s) => s.patientId === adm.patientId && s.status !== "cancelled")
        .sort((a, b) => b.createdAt - a.createdAt),
    [sales, adm.patientId],
  );
  const total = bills.reduce((a, s) => a + billTotal(s), 0);
  const unpaid = bills.filter((s) => s.paid === false);
  const outstanding = unpaid.reduce((a, s) => a + billTotal(s), 0);
  const [mode, setMode] = useState<PayMode>(adm.payerType === "insurance" ? "insurance" : "cash");

  const settleDischarge = () => {
    if (unpaid.length)
      settleBills(
        unpaid.map((s) => s.id),
        mode,
      );
    dischargePatient(adm.id);
    onClose();
  };
  const dischargeOnly = () => {
    dischargePatient(adm.id);
    onClose();
  };

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <div>
            <h3>
              {adm.name}{" "}
              <span className="pd-muted" style={{ fontWeight: 600, fontSize: 13 }}>
                · {adm.bed}
              </span>
            </h3>
            <small className="pd-muted">
              {adm.patientId} · {adm.wardName} · admitted {daysIn(adm.admittedAt, now)}d ago (
              {fmtDateTime(adm.admittedAt)})
            </small>
          </div>
          <button className="pd-iconbtn" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          {/* patient facts */}
          <div className="pd-doc-meta" style={{ marginTop: 0 }}>
            <div>
              <span>Attending</span>
              <b>{adm.doctor || "—"}</b>
            </div>
            <div>
              <span>Diagnosis</span>
              <b>{adm.diagnosis || "—"}</b>
            </div>
            <div>
              <span>Payer</span>
              <b>{adm.payerType === "insurance" ? (adm.insurer ?? "Insurance") : "Self-pay"}</b>
            </div>
            <div>
              <span>{adm.payerType === "insurance" ? "Policy no." : "Phone"}</span>
              <b className="pd-mono">
                {adm.payerType === "insurance" ? adm.policyNo || "—" : adm.phone || "—"}
              </b>
            </div>
          </div>

          <div className="pd-summary-chips" style={{ margin: "16px 0" }}>
            <div className="pd-schip">
              Bills<b>{bills.length}</b>
            </div>
            <div className="pd-schip">
              Total<b>{inr(total)}</b>
            </div>
            <div className="pd-schip">
              Settled<b>{inr(total - outstanding)}</b>
            </div>
            <div className="pd-schip">
              Outstanding<b>{inr(outstanding)}</b>
            </div>
          </div>

          <div className="pd-flex" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <b>Medicine bills</b>
            <button
              className="pd-btn pd-btn-primary pd-btn-sm"
              onClick={() => {
                startWardBilling(adm);
                onClose();
              }}
            >
              <IconPos size={14} /> Bill medicines
            </button>
          </div>
          <div className="pd-tbl-wrap">
            <table className="pd-tbl">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((s) => (
                  <tr key={s.id}>
                    <td className="pd-mono" style={{ fontWeight: 700 }}>
                      {s.id}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(s.createdAt)}</td>
                    <td>
                      {s.items.length}
                      <div className="pd-muted" style={{ fontSize: 11 }}>
                        {s.items
                          .map((i) => i.name)
                          .join(", ")
                          .slice(0, 36)}
                      </div>
                    </td>
                    <td>{PAY_LABEL[s.payMode]}</td>
                    <td>
                      <span className={`pd-pill ${s.paid === false ? "pill-rose" : "pill-green"}`}>
                        {s.paid === false ? "Unpaid" : "Paid"}
                      </span>
                    </td>
                    <td className="num" style={{ fontWeight: 800 }}>
                      {inr(billTotal(s))}
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="pd-empty" style={{ padding: "18px" }}>
                        No bills yet — use “Bill medicines”.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* final settlement */}
          <div
            className="pd-card pd-card-pad"
            style={{ marginTop: 16, background: "var(--wash2)" }}
          >
            <div
              className="pd-flex"
              style={{ justifyContent: "space-between", marginBottom: outstanding > 0 ? 10 : 0 }}
            >
              <b>Final bill & discharge</b>
              <span
                style={{
                  fontFamily: "Manrope",
                  fontWeight: 800,
                  color: outstanding > 0 ? "var(--rose)" : "var(--mid)",
                }}
              >
                {inr(outstanding)} due
              </span>
            </div>
            {outstanding > 0 ? (
              <>
                <div className="pd-flex pd-gap6" style={{ marginBottom: 12, flexWrap: "wrap" }}>
                  {SETTLE_MODES.map((m) => (
                    <button
                      key={m}
                      className={`pd-chip${mode === m ? " on" : ""}`}
                      onClick={() => setMode(m)}
                    >
                      {PAY_LABEL[m]}
                    </button>
                  ))}
                </div>
                <button
                  className="pd-btn pd-btn-primary pd-btn-lg pd-btn-block"
                  onClick={settleDischarge}
                >
                  <IconRupee size={16} /> Settle {inr(outstanding)} ({PAY_LABEL[mode]}) & discharge
                </button>
              </>
            ) : (
              <button
                className="pd-btn pd-btn-primary pd-btn-lg pd-btn-block"
                onClick={dischargeOnly}
              >
                <IconCheck size={16} /> Discharge patient · free bed {adm.bed}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
