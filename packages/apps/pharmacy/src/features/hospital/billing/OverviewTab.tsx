import { useMemo } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import { inr, timeAgo } from "@/domain";
import {
  hospitalAging,
  wardConsumption,
  topSuppliedItems,
  monthlyHospitalFlow,
} from "@/features/hospital/hospitalAccount";
import {
  IconRupee,
  IconHospital,
  IconReceipt,
  IconArrowRight,
  IconAlert,
  IconChart,
  IconSend,
  IconWallet,
  IconBox,
  IconCalendar,
  IconCheck,
  IconStore,
} from "@/components/Icon";

import { fmtDay } from "./fmtDay";
import { IconClockLite } from "./IconClockLite";

type Tab = "overview" | "issue" | "stock" | "account" | "prices";

export function OverviewTab({
  outstanding,
  supplied,
  returns,
  received,
  aging,
  goTab,
  onRecordPayment,
  onRemind,
}: {
  outstanding: number;
  supplied: number;
  returns: number;
  received: number;
  aging: ReturnType<typeof hospitalAging>;
  goTab: (t: Tab) => void;
  onNewIssue: () => void;
  onRecordPayment: () => void;
  onRemind: () => void;
}) {
  const { wardSupplies, hospitalPayments, hospitalAccount: a, wards, now } = usePharma();
  const kpiKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
  const issues = wardSupplies.filter((s) => s.kind === "issue");
  const wardCons = useMemo(() => wardConsumption(wardSupplies), [wardSupplies]);
  const topItems = useMemo(() => topSuppliedItems(wardSupplies, 6), [wardSupplies]);
  const flow = useMemo(
    () => monthlyHospitalFlow(wardSupplies, hospitalPayments, now, 6),
    [wardSupplies, hospitalPayments, now],
  );
  const flowMax = Math.max(1, ...flow.map((f) => Math.max(f.supplied, f.received)));
  const avgIssue = issues.length ? supplied / issues.length : 0;
  const limit = a.creditLimit || 0;
  const util = limit > 0 ? Math.min(100, Math.round((outstanding / limit) * 100)) : 0;
  const available = Math.max(0, limit - outstanding);
  const near = limit > 0 && util >= 85;
  const activeWards = new Set(issues.map((s) => s.wardId)).size;
  const agingMax = Math.max(1, ...aging.buckets.map((b) => b.amount));
  const activity = useMemo(
    () =>
      [
        ...wardSupplies.map((s) => ({
          at: s.at,
          kind: s.kind as string,
          label: `${s.kind === "return" ? "Return from" : "Issued to"} ${s.wardName}`,
          amount: s.total,
          sign: s.kind === "return" ? -1 : 1,
          ref: s.id,
        })),
        ...hospitalPayments.map((p) => ({
          at: p.at,
          kind: "payment",
          label: `Payment received${p.ref ? " · " + p.ref : ""}`,
          amount: p.amount,
          sign: -1,
          ref: p.id,
        })),
      ]
        .sort((x, y) => y.at - x.at)
        .slice(0, 6),
    [wardSupplies, hospitalPayments],
  );

  return (
    <>
      {/* credit position + aging */}
      <div className="pd-hb-grid2" style={{ marginBottom: 16 }}>
        <div className="pd-card pd-card-pad">
          <div className="pd-hb-cardh">
            <IconWallet size={15} /> Credit position
          </div>
          <div className="pd-hb-owe">
            <span>Hospital owes</span>
            <b style={{ color: outstanding > 0 ? "var(--rose)" : "var(--mid)" }}>
              {inr(outstanding)}
            </b>
          </div>
          {limit > 0 ? (
            <>
              <div className={`pd-util${near ? " near" : ""}`}>
                <span style={{ width: `${util}%` }} />
              </div>
              <div className="pd-hb-utilrow">
                <span>
                  {inr(outstanding)} of {inr(limit)} limit
                </span>
                <b>{util}% used</b>
              </div>
              <div className="pd-hb-utilrow">
                <span>Available credit</span>
                <b style={{ color: "var(--mid)" }}>{inr(available)}</b>
              </div>
              {near && (
                <div className="pd-rx-oos" style={{ marginTop: 8 }}>
                  <IconAlert size={12} /> Credit limit almost reached — collect a payment before
                  issuing more.
                </div>
              )}
            </>
          ) : (
            <p className="pd-muted" style={{ fontSize: 12.5 }}>
              No credit limit set — add one in Account &amp; statement.
            </p>
          )}
          <div className="pd-hb-mini">
            <div>
              <span>Supplied</span>
              <b>{inr(supplied)}</b>
            </div>
            <div>
              <span>Returns</span>
              <b>{inr(returns)}</b>
            </div>
            <div>
              <span>Received</span>
              <b>{inr(received)}</b>
            </div>
          </div>
        </div>

        <div className="pd-card pd-card-pad">
          <div className="pd-hb-cardh">
            <IconCalendar size={15} /> Ageing of outstanding
            <button
              className="pd-btn pd-btn-line pd-btn-sm"
              style={{ marginLeft: "auto" }}
              onClick={onRemind}
            >
              <IconSend size={13} /> Send reminder
            </button>
          </div>
          {aging.overdue > 0 ? (
            <div className="pd-hb-overdue">
              <IconAlert size={14} /> <b>{inr(aging.overdue)}</b> overdue
              {aging.overdueDays > 0 ? ` · oldest ${aging.overdueDays} days past due` : ""}
              {aging.dueDate ? ` (due ${fmtDay(aging.dueDate)})` : ""}
            </div>
          ) : (
            <div className="pd-hb-clear">
              <IconCheck size={14} /> Nothing overdue — all within{" "}
              {a.creditTerms === "On demand" ? "terms" : a.creditTerms}
            </div>
          )}
          <div className="pd-agebars">
            {aging.buckets.map((b) => (
              <div className="pd-agebar" key={b.key}>
                <div className="pd-agebar-top">
                  <span>{b.label}</span>
                  <b>{inr(b.amount)}</b>
                </div>
                <div className="pd-prog">
                  <i
                    className={b.key === "0-30" ? "" : "over"}
                    style={{ width: `${(b.amount / agingMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="pd-stats">
        <div
          className="pd-stat link"
          role="button"
          tabIndex={0}
          onClick={() => goTab("issue")}
          onKeyDown={kpiKey(() => goTab("issue"))}
          title="Ward issues log"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="ic ic-green">
            <IconReceipt size={18} />
          </div>
          <div className="lbl">Ward issues</div>
          <div className="val">{issues.length}</div>
          <div className="split">billed to hospital</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-blue">
            <IconRupee size={18} />
          </div>
          <div className="lbl">Supplied value</div>
          <div className="val">{inr(supplied)}</div>
          <div className="split">gross, all time</div>
        </div>
        <div
          className="pd-stat link"
          role="button"
          tabIndex={0}
          onClick={onRecordPayment}
          onKeyDown={kpiKey(onRecordPayment)}
          title="Record a payment"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="ic ic-green">
            <IconWallet size={18} />
          </div>
          <div className="lbl">Payments received</div>
          <div className="val">{inr(received)}</div>
          <div className="split">click to record</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-gold">
            <IconArrowRight size={18} />
          </div>
          <div className="lbl">Avg issue value</div>
          <div className="val">{inr(avgIssue)}</div>
          <div className="split">per ward issue</div>
        </div>
        <div
          className="pd-stat link"
          role="button"
          tabIndex={0}
          onClick={() => goTab("stock")}
          onKeyDown={kpiKey(() => goTab("stock"))}
          title="Ward stock on hand"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="ic ic-teal">
            <IconStore size={18} />
          </div>
          <div className="lbl">Active wards</div>
          <div className="val">{activeWards}</div>
          <div className="split">of {wards.length} total</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-rose">
            <IconAlert size={18} />
          </div>
          <div className="lbl">Overdue</div>
          <div className="val" style={{ color: aging.overdue > 0 ? "var(--rose)" : undefined }}>
            {inr(aging.overdue)}
          </div>
          <div className="split">
            {aging.overdueDays > 0 ? `${aging.overdueDays} days past due` : "on track"}
          </div>
        </div>
      </div>

      {/* leaderboards */}
      <div className="pd-hb-grid2" style={{ marginTop: 16 }}>
        <div className="pd-card pd-card-pad">
          <div className="pd-hb-cardh">
            <IconHospital size={15} /> Consumption by ward
            <button
              className="pd-btn pd-btn-line pd-btn-sm"
              style={{ marginLeft: "auto" }}
              onClick={() => goTab("stock")}
            >
              Ward stock <IconArrowRight size={13} />
            </button>
          </div>
          {wardCons.length === 0 ? (
            <p className="pd-muted" style={{ fontSize: 12.5 }}>
              No ward issues yet.
            </p>
          ) : (
            wardCons.slice(0, 5).map((w) => {
              const max = wardCons[0].net || 1;
              return (
                <div key={w.wardId} style={{ marginBottom: 10 }}>
                  <div
                    className="pd-flex"
                    style={{ justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}
                  >
                    <span>
                      {w.wardName}
                      <span className="pd-muted">
                        {" "}
                        · {w.issues} issue{w.issues !== 1 ? "s" : ""}
                      </span>
                    </span>
                    <b>{inr(w.net)}</b>
                  </div>
                  <div className="pd-prog">
                    <i style={{ width: `${(w.net / max) * 100}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="pd-card pd-card-pad">
          <div className="pd-hb-cardh">
            <IconBox size={15} /> Top medicines supplied
          </div>
          {topItems.length === 0 ? (
            <p className="pd-muted" style={{ fontSize: 12.5 }}>
              No data yet.
            </p>
          ) : (
            <table className="pd-tbl pd-hb-mtbl">
              <tbody>
                {topItems.map((it) => (
                  <tr key={it.productId || it.name}>
                    <td>{it.name}</td>
                    <td className="num pd-muted" style={{ fontSize: 12 }}>
                      ×{it.qty}
                    </td>
                    <td className="num" style={{ fontWeight: 700 }}>
                      {inr(it.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* monthly flow + recent activity */}
      <div className="pd-hb-grid2" style={{ marginTop: 16 }}>
        <div className="pd-card pd-card-pad">
          <div className="pd-hb-cardh">
            <IconChart size={15} /> Supplied vs received · 6 months
          </div>
          <div className="pd-hb-flow">
            {flow.map((f, i) => (
              <div className="pd-hb-flowcol" key={i}>
                <div className="pd-hb-bars">
                  <span
                    className="sup"
                    style={{ height: `${(f.supplied / flowMax) * 100}%` }}
                    title={`Supplied ${inr(f.supplied)}`}
                  />
                  <span
                    className="rec"
                    style={{ height: `${(f.received / flowMax) * 100}%` }}
                    title={`Received ${inr(f.received)}`}
                  />
                </div>
                <small>{f.label}</small>
              </div>
            ))}
          </div>
          <div className="pd-rx-legend" style={{ marginTop: 4 }}>
            <span>
              <i style={{ background: "var(--mid)" }} /> Supplied
            </span>
            <span>
              <i style={{ background: "#8a6ee0" }} /> Received
            </span>
          </div>
        </div>
        <div className="pd-card pd-card-pad">
          <div className="pd-hb-cardh">
            <IconClockLite /> Recent activity
            <button
              className="pd-btn pd-btn-line pd-btn-sm"
              style={{ marginLeft: "auto" }}
              onClick={() => goTab("account")}
            >
              Statement <IconArrowRight size={13} />
            </button>
          </div>
          <div className="pd-hb-acts">
            {activity.map((e, i) => (
              <div className="pd-hb-act" key={i}>
                <span className={`dot ${e.kind}`} />
                <span className="lb">
                  {e.label}
                  <small>
                    {e.ref} · {timeAgo(e.at, now)}
                  </small>
                </span>
                <b style={{ color: e.sign < 0 ? "var(--mid)" : "var(--ink)" }}>
                  {e.sign < 0 ? "−" : ""}
                  {inr(e.amount)}
                </b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
