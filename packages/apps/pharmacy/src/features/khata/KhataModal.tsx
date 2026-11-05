import { useState } from "react";
import {
  inr,
  fmtDateTime,
  timeAgo,
  Sale,
  PayMode,
  PAY_LABEL,
  CreditPayment,
  CreditCustomer,
  customerLedger,
  SETTLED_MODES,
  waLink,
  smsLink,
  collectMsg,
  creditAging,
  CreditAging,
} from "@/domain";
import {
  IconX,
  IconCheck,
  IconWhatsApp,
  IconMessage,
  IconRupee,
  IconReceipt,
  IconClock,
  IconPhone,
} from "@/components/Icon";

export function KhataModal({
  c,
  onClose,
  sales,
  creditPayments,
  recordCreditPayment,
  profile,
  now,
  go,
}: {
  c: CreditCustomer;
  onClose: () => void;
  sales: Sale[];
  creditPayments: CreditPayment[];
  recordCreditPayment: (p: {
    custKey: string;
    custName: string;
    custPhone: string;
    amount: number;
    mode: PayMode;
    note?: string;
  }) => Promise<unknown>;
  profile: any;
  now: number;
  go: (r: any) => void;
}) {
  const ledger = customerLedger(c.key, sales, creditPayments);
  const aging: CreditAging = creditAging(c.key, sales, creditPayments, now);
  const [repay, setRepay] = useState(c.outstanding > 0);
  const [amt, setAmt] = useState(c.outstanding);
  const [mode, setMode] = useState<PayMode>("cash");
  const doRepay = async () => {
    if (amt <= 0) return;
    const err = await recordCreditPayment({
      custKey: c.key,
      custName: c.name,
      custPhone: c.phone,
      amount: Math.min(amt, c.outstanding || amt),
      mode,
    });
    if (!err) setRepay(false);
  };
  const collectText = collectMsg(c.name, profile.name, c.outstanding, profile.phone);
  const firstBillAt = Math.min(...ledger.filter((r) => r.kind === "debit").map((r) => r.at), now);

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {c.name} · Khata{" "}
              {aging.overdue && <span className="pd-pill pill-rose">Overdue {aging.ageDays}d</span>}
            </h3>
            <div
              className="pd-muted"
              style={{ fontSize: 12.5, marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}
            >
              <span>
                <IconPhone size={11} /> {c.phone || "—"}
              </span>
              <span>
                <IconClock size={11} /> Credit since {fmtDateTime(firstBillAt).split(",")[0]}
              </span>
            </div>
          </div>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          <div className="pd-summary-chips">
            <div className="pd-schip">
              Credit given<b>{inr(c.given)}</b>
            </div>
            <div className="pd-schip">
              Repaid<b style={{ color: "var(--green)" }}>{inr(c.repaid)}</b>
            </div>
            <div className="pd-schip">
              Outstanding
              <b
                style={{ color: c.outstanding > 0 ? "var(--rose)" : "var(--green)", fontSize: 15 }}
              >
                {inr(c.outstanding)}
              </b>
            </div>
            <div className="pd-schip">
              Unpaid bills<b>{aging.unpaidBills.length}</b>
            </div>
            <div className="pd-schip">
              Oldest due
              <b style={{ color: aging.overdue ? "var(--rose)" : undefined }}>
                {aging.oldestUnpaidAt ? `${aging.ageDays}d` : "—"}
              </b>
            </div>
          </div>

          {/* actions */}
          <div
            className="pd-flex"
            style={{ gap: 8, alignItems: "center", flexWrap: "wrap", margin: "6px 0 12px" }}
          >
            {c.outstanding > 0 && !repay && (
              <button
                className="pd-btn pd-btn-primary"
                onClick={() => {
                  setAmt(c.outstanding);
                  setRepay(true);
                }}
              >
                <IconRupee size={15} /> Record repayment
              </button>
            )}
            <button
              className="pd-btn pd-btn-ghost"
              disabled={!c.phone}
              onClick={() => window.open(waLink(c.phone, collectText), "_blank")}
            >
              <IconWhatsApp size={15} /> Send reminder
            </button>
            <button
              className="pd-btn pd-btn-ghost"
              disabled={!c.phone}
              onClick={() => window.open(smsLink(c.phone, collectText), "_blank")}
            >
              <IconMessage size={15} /> SMS
            </button>
            <button
              className="pd-btn pd-btn-ghost"
              onClick={() => {
                onClose();
                go("pos");
              }}
            >
              <IconReceipt size={15} /> New credit sale
            </button>
          </div>

          {repay && c.outstanding > 0 && (
            <div
              className="pd-card pd-card-pad"
              style={{ background: "var(--wash2)", marginBottom: 14 }}
            >
              <div className="pd-flex" style={{ gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {[500, 1000, 2000]
                  .filter((v) => v < c.outstanding)
                  .map((v) => (
                    <button
                      key={v}
                      className={`pd-chip${amt === v ? " on" : ""}`}
                      onClick={() => setAmt(v)}
                    >
                      {inr(v)}
                    </button>
                  ))}
                <button
                  className={`pd-chip${amt === Math.round(c.outstanding / 2) ? " on" : ""}`}
                  onClick={() => setAmt(Math.round(c.outstanding / 2))}
                >
                  Half
                </button>
                <button
                  className={`pd-chip${amt === c.outstanding ? " on" : ""}`}
                  onClick={() => setAmt(c.outstanding)}
                >
                  Full · {inr(c.outstanding)}
                </button>
              </div>
              <div className="pd-flex" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  className="pd-input"
                  data-field="amount"
                  type="number"
                  min={0}
                  value={amt || ""}
                  onChange={(e) => setAmt(Number(e.target.value) || 0)}
                  placeholder="Amount ₹"
                  style={{ width: 120 }}
                  autoFocus
                />
                <select
                  className="pd-select"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as PayMode)}
                  style={{ width: 120 }}
                >
                  {SETTLED_MODES.filter((m) => m !== "cod").map((m) => (
                    <option key={m} value={m}>
                      {PAY_LABEL[m]}
                    </option>
                  ))}
                </select>
                <button className="pd-btn pd-btn-primary" disabled={amt <= 0} onClick={doRepay}>
                  <IconCheck size={14} /> Collect {inr(Math.min(amt, c.outstanding || amt))}
                </button>
                <button className="pd-btn pd-btn-ghost" onClick={() => setRepay(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="pd-grid-2">
            {/* unpaid bills */}
            <div>
              <div className="pd-pl-head" style={{ marginTop: 0 }}>
                Unpaid bills{" "}
                <span className="pd-muted" style={{ fontWeight: 500, fontSize: 12 }}>
                  · FIFO
                </span>
              </div>
              <div className="pd-card" style={{ overflow: "hidden" }}>
                {aging.unpaidBills.length === 0 ? (
                  <div className="pd-empty" style={{ padding: 16 }}>
                    <div className="em">
                      <IconCheck size={24} />
                    </div>
                    <p>Fully settled.</p>
                  </div>
                ) : (
                  aging.unpaidBills.map((b) => {
                    const d = Math.floor((now - b.at) / 86400000);
                    return (
                      <div className="pd-medrow" key={b.id}>
                        <span
                          className="em"
                          style={{ color: d > 30 ? "var(--rose)" : "var(--mid)" }}
                        >
                          <IconReceipt size={14} />
                        </span>
                        <span className="gw">
                          <div className="t pd-mono">{b.id}</div>
                          <div className="s">
                            {fmtDateTime(b.at).split(",")[0]} · {b.items} items · {d}d old
                          </div>
                        </span>
                        <span style={{ textAlign: "right" }}>
                          <b style={{ color: "var(--rose)", fontSize: 13 }}>{inr(b.remaining)}</b>
                          {b.remaining < b.amount && (
                            <div className="pd-muted" style={{ fontSize: 10.5 }}>
                              of {inr(b.amount)}
                            </div>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* full ledger */}
            <div>
              <div className="pd-pl-head" style={{ marginTop: 0 }}>
                Account ledger{" "}
                <span className="pd-muted" style={{ fontWeight: 500, fontSize: 12 }}>
                  · {ledger.length}
                </span>
              </div>
              <div
                className="pd-card"
                style={{ overflow: "hidden", maxHeight: 260, overflowY: "auto" }}
              >
                {ledger.length === 0 ? (
                  <div className="pd-empty" style={{ padding: 16 }}>
                    <p>No activity.</p>
                  </div>
                ) : (
                  ledger.map((r, i) => (
                    <div className="pd-medrow" key={i}>
                      <span
                        className="em"
                        style={{ color: r.kind === "debit" ? "var(--rose)" : "var(--green)" }}
                      >
                        {r.kind === "debit" ? "−" : "+"}
                      </span>
                      <span className="gw">
                        <div className="t">{r.label}</div>
                        <div className="s pd-mono">
                          {r.ref} · {timeAgo(r.at, now)}
                        </div>
                      </span>
                      <b
                        style={{
                          color: r.kind === "debit" ? "var(--rose)" : "var(--green)",
                          fontSize: 13,
                        }}
                      >
                        {r.kind === "debit" ? "−" : "+"}
                        {inr(r.amount)}
                      </b>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="pd-modal-foot">
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Close
          </button>
          {c.outstanding > 0 && (
            <button
              className="pd-btn pd-btn-primary"
              disabled={!c.phone}
              onClick={() => window.open(waLink(c.phone, collectText), "_blank")}
            >
              <IconWhatsApp size={15} /> Send reminder
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
