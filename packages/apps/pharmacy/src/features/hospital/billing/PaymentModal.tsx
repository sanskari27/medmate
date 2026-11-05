import { useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import { inr, PayMode, PAY_LABEL } from "@/domain";
import { IconX } from "@/components/Icon";

export function PaymentModal({
  onClose,
  outstanding,
}: {
  onClose: () => void;
  outstanding: number;
}) {
  const { recordHospitalPayment } = usePharma();
  const [amount, setAmount] = useState(outstanding > 0 ? String(Math.round(outstanding)) : "");
  const [mode, setMode] = useState<PayMode>("upi");
  const [ref, setRef] = useState("");
  const amt = Number(amount) || 0;
  const MODES: PayMode[] = ["upi", "card", "cash"];
  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <h3>Record hospital payment</h3>
          <button className="pd-iconbtn" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          <p className="pd-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
            Outstanding: <b style={{ color: "var(--rose)" }}>{inr(outstanding)}</b>
          </p>
          <div className="pd-field" data-field="amount">
            <label>Amount received ₹</label>
            <input
              className="pd-input"
              autoFocus
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="pd-field" style={{ marginTop: 12 }}>
            <label>Mode</label>
            <div className="pd-flex pd-gap6" style={{ marginTop: 4 }}>
              {MODES.map((m) => (
                <button
                  key={m}
                  className={`pd-chip${mode === m ? " on" : ""}`}
                  onClick={() => setMode(m)}
                >
                  {PAY_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="pd-field" style={{ marginTop: 12 }}>
            <label>Reference (NEFT / UTR / cheque no.)</label>
            <input
              className="pd-input"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <div className="pd-modal-foot">
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="pd-btn pd-btn-primary"
            disabled={amt <= 0}
            onClick={async () => {
              const err = await recordHospitalPayment({
                amount: amt,
                mode,
                ref: ref.trim() || undefined,
              });
              if (!err) onClose();
            }}
          >
            Record {inr(amt)}
          </button>
        </div>
      </div>
    </div>
  );
}
