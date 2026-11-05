import { KhataModal } from "./KhataModal";
import { useState, useMemo } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  inr, fmtDateTime, timeAgo, Sale, PayMode, PAY_LABEL, CreditPayment, CreditCustomer,
  creditCustomers, customerLedger, totalCreditOutstanding, SETTLED_MODES, waLink, smsLink, collectMsg,
  creditAging, creditAgingBuckets, CreditAging,
} from "@/domain";
import { IconSearch, IconX, IconCheck, IconWhatsApp, IconMessage, IconRupee, IconReceipt, IconUsers, IconAlert, IconArrowRight, IconClock, IconPhone } from "@/components/Icon";

const BUCKET_TONE: Record<string, string> = { cur: "var(--green)", d60: "var(--gold)", d60p: "var(--rose)" };

export default function KhataScreen() {
  const { sales, creditPayments, recordCreditPayment, profile, now, go } = usePharma();
  const [tab, setTab] = useState<"dues" | "history">("dues");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<CreditCustomer | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sort, setSort] = useState<"out" | "age">("out");

  const rows = useMemo(() => creditCustomers(sales, creditPayments), [sales, creditPayments]);
  const due = useMemo(() => rows.filter((r) => r.outstanding > 0), [rows]);
  const agingByKey = useMemo(() => new Map(due.map((r) => [r.key, creditAging(r.key, sales, creditPayments, now)])), [due, sales, creditPayments, now]);
  const outstanding = totalCreditOutstanding(sales, creditPayments);
  const given = rows.reduce((a, r) => a + r.given, 0);
  const repaid = rows.reduce((a, r) => a + r.repaid, 0);
  const overdue = due.filter((r) => agingByKey.get(r.key)?.overdue);
  const overdueAmt = overdue.reduce((a, r) => a + r.outstanding, 0);
  const buckets = useMemo(() => creditAgingBuckets(due, sales, creditPayments, now), [due, sales, creditPayments, now]);
  const bucketMax = Math.max(1, ...buckets.map((b) => b.amount));
  const monthStart = useMemo(() => { const d = new Date(now); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime(); }, [now]);
  const collectedMonth = creditPayments.filter((p) => p.at >= monthStart).reduce((a, p) => a + p.amount, 0);
  const avgOut = due.length ? outstanding / due.length : 0;
  const collectionRate = given > 0 ? Math.round((repaid / given) * 100) : 0;

  const history = useMemo(() => [...creditPayments].sort((a, b) => b.at - a.at), [creditPayments]);
  const filteredDue = useMemo(() => {
    let l = due.filter((r) => (!overdueOnly || agingByKey.get(r.key)?.overdue) && (!q || `${r.name} ${r.phone}`.toLowerCase().includes(q.toLowerCase())));
    l = [...l].sort((a, b) => sort === "age" ? (agingByKey.get(b.key)?.ageDays ?? 0) - (agingByKey.get(a.key)?.ageDays ?? 0) : b.outstanding - a.outstanding);
    return l;
  }, [due, overdueOnly, q, sort, agingByKey]);

  const goDues = (od: boolean) => { setTab("dues"); setOverdueOnly(od); };

  return (
    <div className="pd-canvas-wide">
      {/* clickable KPI cards */}
      <div className="pd-stats" >
        <div className="pd-stat link" role="button" tabIndex={0} onClick={() => goDues(false)} title="See who owes you">
          <span className="go"><IconArrowRight size={16} /></span>
          <div className="ic ic-rose"><IconReceipt size={18} /></div><div className="lbl">Total outstanding</div><div className="val">{inr(outstanding)}</div>
          <div className="split">{due.length} account{due.length !== 1 ? "s" : ""} · avg {inr(avgOut)}</div>
        </div>
        <div className="pd-stat link" role="button" tabIndex={0} onClick={() => goDues(true)} title="Overdue > 30 days">
          <span className="go"><IconArrowRight size={16} /></span>
          <div className="ic ic-gold"><IconAlert size={18} /></div><div className="lbl">Overdue (30d+)</div><div className="val" style={{ color: overdueAmt > 0 ? "var(--rose)" : undefined }}>{inr(overdueAmt)}</div>
          <div className="split">{overdue.length} account{overdue.length !== 1 ? "s" : ""} to chase</div>
        </div>
        <div className="pd-stat link" role="button" tabIndex={0} onClick={() => setTab("history")} title="View repayments">
          <span className="go"><IconArrowRight size={16} /></span>
          <div className="ic ic-green"><IconRupee size={18} /></div><div className="lbl">Collected this month</div><div className="val">{inr(collectedMonth)}</div>
          <div className="split">{repaid > 0 ? `${collectionRate}% collection rate` : "no repayments yet"}</div>
        </div>
        <div className="pd-stat"><div className="ic ic-blue"><IconUsers size={18} /></div><div className="lbl">Credit given (all time)</div><div className="val">{inr(given)}</div><div className="split">{rows.length} khata account{rows.length !== 1 ? "s" : ""}</div></div>
      </div>

      {/* aging analysis */}
      <div className="pd-card" style={{ marginTop: 16 }}>
        <div className="pd-card-head"><h3>Aging of receivables</h3><span className="sub">by oldest unpaid bill · click a band to filter</span></div>
        <div className="pd-card-pad">
          <div className="pd-agebar">
            {buckets.map((b) => b.amount > 0 && (
              <button key={b.key} className="seg" style={{ flexGrow: b.amount, background: BUCKET_TONE[b.key] }} title={`${b.label}: ${inr(b.amount)}`} onClick={() => goDues(b.key !== "cur")} />
            ))}
            {outstanding <= 0 && <div className="seg empty" />}
          </div>
          <div className="pd-agelegend">
            {buckets.map((b) => (
              <button key={b.key} className="it" onClick={() => goDues(b.key !== "cur")}>
                <span className="dot" style={{ background: BUCKET_TONE[b.key] }} />
                <span className="lb">{b.label}</span>
                <b>{inr(b.amount)}</b>
                <span className="pd-muted" style={{ fontSize: 11 }}>{b.count} a/c</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pd-toolbar" style={{ marginTop: 16 }}>
        <div className="pd-seg">
          <button className={tab === "dues" ? "on" : ""} onClick={() => setTab("dues")}>Outstanding{due.length ? ` · ${due.length}` : ""}</button>
          <button className={tab === "history" ? "on" : ""} onClick={() => setTab("history")}>Payment history</button>
        </div>
        <div className="pd-spacer" />
        {tab === "dues" && <>
          <button className={`pd-chip${overdueOnly ? " on" : ""}`} onClick={() => setOverdueOnly((v) => !v)}><IconAlert size={13} /> Overdue only{overdue.length ? ` · ${overdue.length}` : ""}</button>
          <div className="pd-seg" style={{ padding: 2 }}>
            <button className={sort === "out" ? "on" : ""} style={{ padding: "5px 10px" }} onClick={() => setSort("out")}>Amount</button>
            <button className={sort === "age" ? "on" : ""} style={{ padding: "5px 10px" }} onClick={() => setSort("age")}>Oldest</button>
          </div>
          <div className="pd-search-inline"><span className="ic"><IconSearch size={17} /></span><input placeholder="Search customer or phone…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </>}
        <button className="pd-btn pd-btn-primary" onClick={() => go("pos")}><IconReceipt size={15} /> New credit sale</button>
      </div>

      {tab === "dues" ? (
        <div className="pd-card">
          <div className="pd-tbl-wrap">
            <table className="pd-tbl">
              <thead><tr><th>Customer</th><th>Phone</th><th className="num">Bills</th><th className="num">Given</th><th className="num">Repaid</th><th className="num">Outstanding</th><th>Age</th><th>Collect</th></tr></thead>
              <tbody>
                {filteredDue.map((r) => {
                  const ag = agingByKey.get(r.key);
                  return (
                    <tr key={r.key} style={{ cursor: "pointer" }} onClick={() => setOpen(r)}>
                      <td><div className="prod"><span className="em"><IconUsers size={15} /></span><span className="nm">{r.name}</span></div></td>
                      <td className="pd-mono">{r.phone || "—"}</td>
                      <td className="num">{r.bills}</td>
                      <td className="num">{inr(r.given)}</td>
                      <td className="num pd-muted">{inr(r.repaid)}</td>
                      <td className="num" style={{ fontWeight: 800, color: "var(--rose)" }}>{inr(r.outstanding)}</td>
                      <td><span className={`pd-pill ${ag?.overdue ? "pill-rose" : ag && ag.ageDays > 15 ? "pill-gold" : "pill-gray"}`}>{ag?.ageDays ?? 0}d{ag?.overdue ? " · overdue" : ""}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="pd-btn pd-btn-ghost pd-btn-sm" disabled={!r.phone} title="WhatsApp reminder"
                          onClick={() => window.open(waLink(r.phone, collectMsg(r.name, profile.name, r.outstanding, profile.phone)), "_blank")}>
                          <IconWhatsApp size={14} /> Remind
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredDue.length === 0 && <tr><td colSpan={8}><div className="pd-empty"><div className="em"><IconCheck size={28} /></div><p>{overdueOnly ? "No overdue accounts — nicely collected!" : "No outstanding credit — all khata settled."}</p></div></td></tr>}
              </tbody>
              {filteredDue.length > 0 && <tfoot><tr><td colSpan={5}>Total · {filteredDue.length} account{filteredDue.length !== 1 ? "s" : ""}</td><td className="num" style={{ fontWeight: 800 }}>{inr(filteredDue.reduce((a, r) => a + r.outstanding, 0))}</td><td colSpan={2}></td></tr></tfoot>}
            </table>
          </div>
        </div>
      ) : (
        <div className="pd-card">
          <div className="pd-tbl-wrap">
            <table className="pd-tbl">
              <thead><tr><th>Receipt</th><th>Date & time</th><th>Customer</th><th>Mode</th><th>Note</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {history.map((p) => {
                  const c = rows.find((x) => x.key === p.custKey);
                  return (
                    <tr key={p.id} style={{ cursor: c ? "pointer" : "default" }} onClick={() => c && setOpen(c)}>
                      <td className="pd-mono" style={{ fontWeight: 700 }}>{p.id}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(p.at)}</td>
                      <td>{p.custName}</td>
                      <td>{PAY_LABEL[p.mode]}</td>
                      <td className="pd-muted">{p.note || "—"}</td>
                      <td className="num" style={{ fontWeight: 800, color: "var(--green)" }}>+{inr(p.amount)}</td>
                    </tr>
                  );
                })}
                {history.length === 0 && <tr><td colSpan={6}><div className="pd-empty"><div className="em"><IconReceipt size={28} /></div><p>No repayments recorded yet.</p></div></td></tr>}
              </tbody>
              {history.length > 0 && <tfoot><tr><td colSpan={5}>Total collected · {history.length} repayment{history.length !== 1 ? "s" : ""}</td><td className="num" style={{ fontWeight: 800 }}>{inr(history.reduce((a, p) => a + p.amount, 0))}</td></tr></tfoot>}
            </table>
          </div>
        </div>
      )}

      {open && <KhataModal c={open} onClose={() => setOpen(null)} sales={sales} creditPayments={creditPayments} recordCreditPayment={recordCreditPayment} profile={profile} now={now} go={go} />}
    </div>
  );
}

