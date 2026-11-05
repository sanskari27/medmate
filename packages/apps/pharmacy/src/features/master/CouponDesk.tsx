import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plan } from "@/domain";

import { plusDays } from "./plusDays";
import { Table } from "./Table";
import { makeCode } from "./makeCode";

type CouponRow = {
  code: string;
  plan: string;
  expiresOn: string;
  validDays: number;
  redeemed: number;
};

export function CouponDesk() {
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [code, setCode] = useState("");
  const [plan, setPlan] = useState<Plan>("Growth");
  const [expiresOn, setExpiresOn] = useState(plusDays(30));
  const [validDays, setValidDays] = useState(30);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () =>
    api<CouponRow[]>("/master/coupons")
      .then(setRows)
      .catch((err: Error) => setError(err.message));
  useEffect(() => {
    void load();
  }, []);
  const issue = async () => {
    setError("");
    setBusy(true);
    try {
      await api("/master/coupons", { method: "POST", body: { code, plan, expiresOn, validDays } });
      setCode("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not issue the coupon");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="pd-card pd-card-pad" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Issue a coupon</h3>
        <p className="pd-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
          The code works until the expiry date. Redeeming it turns on the plan for the validity
          days. Each pharmacy can redeem one coupon.
        </p>
        {error && (
          <p className="pd-form-alert" role="alert">
            {error}
          </p>
        )}
        <div className="pd-flex pd-gap6" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="pd-field">
            <label htmlFor="issue-code">Code</label>
            <input
              id="issue-code"
              className="pd-input"
              value={code}
              autoComplete="off"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <button className="pd-btn pd-btn-ghost" type="button" onClick={() => setCode(makeCode())}>
            Generate
          </button>
          <div className="pd-field">
            <label htmlFor="issue-plan">Plan</label>
            <select
              id="issue-plan"
              className="pd-select"
              value={plan}
              onChange={(e) => setPlan(e.target.value as Plan)}
            >
              {(["Care", "Growth", "Flagship"] as Plan[]).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="pd-field">
            <label htmlFor="issue-expiry">Coupon expiry</label>
            <input
              id="issue-expiry"
              className="pd-input"
              type="date"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
            />
          </div>
          <div className="pd-field">
            <label htmlFor="issue-days">Plan validity (days)</label>
            <input
              id="issue-days"
              className="pd-input"
              type="number"
              min={1}
              max={3650}
              value={validDays}
              onChange={(e) => setValidDays(Number(e.target.value))}
            />
          </div>
          <button className="pd-btn pd-btn-primary" disabled={busy} onClick={() => void issue()}>
            Issue coupon
          </button>
        </div>
      </div>
      <Table columns={["Code", "Plan", "Expires", "Validity", "Redeemed"]} empty="No coupons yet.">
        {rows.map((row) => (
          <tr key={row.code}>
            <td>{row.code}</td>
            <td>{row.plan}</td>
            <td>{row.expiresOn}</td>
            <td>{row.validDays} days</td>
            <td>{row.redeemed}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
