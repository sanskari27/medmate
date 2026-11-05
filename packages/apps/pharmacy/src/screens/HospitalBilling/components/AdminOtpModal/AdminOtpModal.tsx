import { useState } from "react";
import { usePharma } from "@/store/slices/session";
import { IconX, IconLock } from "@/components/Icon";

export function AdminOtpModal({ onClose }: { onClose: () => void }) {
  const { unlockPricing } = usePharma();
  const [otp, setOtp] = useState("");
  const demoCode = !import.meta.env.PROD ? "123456" : "";
  const submit = () => {
    void unlockPricing(otp).then((ok) => {
      if (ok) onClose();
    });
  };
  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <h3>
            <IconLock size={16} /> Admin approval
          </h3>
          <button className="pd-iconbtn" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          <p className="pd-muted" style={{ fontSize: 13, marginBottom: 12 }}>
            Institutional pricing is protected. Enter the admin OTP to make changes.
          </p>
          <div className="pd-field" data-field="otp">
            <label>Admin OTP</label>
            <input
              className="pd-input pd-mono"
              style={{ letterSpacing: ".4em", textAlign: "center", fontSize: 18 }}
              inputMode="numeric"
              maxLength={6}
              value={otp}
              autoFocus
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••"
            />
          </div>
          {demoCode ? (
            <div
              className="pd-muted"
              style={{
                fontSize: 12,
                marginTop: 8,
                background: "var(--wash2)",
                border: "1px dashed var(--line-2)",
                borderRadius: 8,
                padding: "7px 11px",
              }}
            >
              Demo admin OTP: <b>{demoCode}</b>{" "}
              <button
                className="pd-btn pd-btn-ghost pd-btn-sm"
                style={{ marginLeft: 6 }}
                onClick={() => setOtp(demoCode)}
              >
                Auto-fill
              </button>
            </div>
          ) : null}
        </div>
        <div className="pd-modal-foot">
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="pd-btn pd-btn-primary" disabled={otp.length !== 6} onClick={submit}>
            Unlock pricing
          </button>
        </div>
      </div>
    </div>
  );
}
