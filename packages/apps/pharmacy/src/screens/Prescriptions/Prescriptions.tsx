import { startOfToday } from "@/screens/Prescriptions/utils/startOfToday";
import { RxCard } from "@/screens/Prescriptions/components/RxCard";
import { RxDetail } from "@/screens/Prescriptions/components/RxDetail";
import { RejectModal } from "@/screens/Prescriptions/components/RejectModal";
import { useMemo, useState } from "react";
import { usePharma } from "@/hooks";
import {
  RxStatus,
  Prescription,
  inr,
  rxOverdue,
  rxTurnaroundMins,
  rxAvailability,
  fmtMins,
  RX_SLA_MINS,
} from "@/utils";
import {
  IconCheck,
  IconArrowRight,
  IconClock,
  IconDoc,
  IconPill,
  IconAlert,
  IconRupee,
  IconStethoscope,
  IconSearch,
  IconBolt,
  IconChart,
  IconShield,
} from "@/components/Icon";

export default function PrescriptionsScreen() {
  const { prescriptions, inventory, now, approveRx, rejectRx, dispenseRx } = usePharma();
  const [tab, setTab] = useState<RxStatus | "all">("pending");
  const [kind, setKind] = useState<"all" | "digital" | "uploaded">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Prescription | null>(null);
  const [rejecting, setRejecting] = useState<Prescription | null>(null);
  const kpiKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  const counts = (s: RxStatus) => prescriptions.filter((r) => r.status === s).length;

  // ── metrics ──
  const m = useMemo(() => {
    const total = prescriptions.length;
    const pending = prescriptions.filter((r) => r.status === "pending");
    const overdue = pending.filter((r) => rxOverdue(r, now));
    const approved = prescriptions.filter((r) => r.status === "approved");
    const dispensed = prescriptions.filter((r) => r.status === "dispensed");
    const t0 = startOfToday(now);
    const dispToday = dispensed.filter((r) => (r.dispensedAt ?? 0) >= t0);
    const dispTodayValue = dispToday.reduce((a, r) => a + rxAvailability(r, inventory).value, 0);
    const digital = prescriptions.filter((r) => r.kind === "digital").length;
    const turns = dispensed.map((r) => rxTurnaroundMins(r)).filter((x): x is number => x != null);
    const avgTurn = turns.length
      ? Math.round(turns.reduce((a, b) => a + b, 0) / turns.length)
      : null;
    const byDoctor: Record<string, number> = {};
    prescriptions.forEach((r) => {
      if (r.doctor && !/illegible/i.test(r.doctor))
        byDoctor[r.doctor] = (byDoctor[r.doctor] || 0) + 1;
    });
    const topDoctors = Object.entries(byDoctor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    return {
      total,
      pending,
      overdue,
      approved,
      dispensed,
      dispToday,
      dispTodayValue,
      digital,
      uploaded: total - digital,
      avgTurn,
      topDoctors,
    };
  }, [prescriptions, inventory, now]);

  const digitalPct = m.total ? Math.round((m.digital / m.total) * 100) : 0;
  const slaPct = m.pending.length
    ? Math.round(((m.pending.length - m.overdue.length) / m.pending.length) * 100)
    : 100;

  // ── filtered + prioritised list ──
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return prescriptions
      .filter(
        (r) =>
          (tab === "all" || r.status === tab) &&
          (kind === "all" || r.kind === kind) &&
          (!ql || `${r.id} ${r.patient} ${r.doctor}`.toLowerCase().includes(ql)),
      )
      .sort((a, b) => {
        if (!!a.urgent !== !!b.urgent) return a.urgent ? -1 : 1;
        if (a.status === "pending" && b.status === "pending") return a.uploadedAt - b.uploadedAt; // oldest first
        return b.uploadedAt - a.uploadedAt;
      });
  }, [prescriptions, tab, kind, q]);

  const TABS: { k: RxStatus | "all"; label: string; n?: number }[] = [
    { k: "pending", label: "Pending", n: counts("pending") },
    { k: "approved", label: "Approved", n: counts("approved") },
    { k: "dispensed", label: "Dispensed", n: counts("dispensed") },
    { k: "rejected", label: "Rejected", n: counts("rejected") },
    { k: "all", label: "All" },
  ];

  return (
    <div className="pd-canvas-wide">
      {/* ── KPIs ── */}
      <div className="pd-stats">
        <div
          className="pd-stat link"
          role="button"
          tabIndex={0}
          onClick={() => setTab("pending")}
          onKeyDown={kpiKey(() => setTab("pending"))}
          title="Pending queue"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="ic ic-gold">
            <IconClock size={18} />
          </div>
          <div className="lbl">Pending review</div>
          <div className="val">{m.pending.length}</div>
          <div className="split">
            {m.overdue.length ? (
              <b style={{ color: "var(--rose)" }}>{m.overdue.length} over SLA</b>
            ) : (
              "all within 2h"
            )}
          </div>
        </div>
        <div
          className="pd-stat link"
          role="button"
          tabIndex={0}
          onClick={() => setTab("approved")}
          onKeyDown={kpiKey(() => setTab("approved"))}
          title="Ready to bill"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="ic ic-blue">
            <IconCheck size={18} />
          </div>
          <div className="lbl">Awaiting dispense</div>
          <div className="val">{m.approved.length}</div>
          <div className="split">approved · ready to bill</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-green">
            <IconRupee size={18} />
          </div>
          <div className="lbl">Dispensed today</div>
          <div className="val">{m.dispToday.length}</div>
          <div className="split">{inr(m.dispTodayValue)} billed</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-teal">
            <IconBolt size={18} />
          </div>
          <div className="lbl">Avg turnaround</div>
          <div className="val">{fmtMins(m.avgTurn)}</div>
          <div className="split">upload → dispensed</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-violet">
            <IconPill size={18} />
          </div>
          <div className="lbl">Digital share</div>
          <div className="val">{digitalPct}%</div>
          <div className="split">
            {m.digital} digital · {m.uploaded} uploaded
          </div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-green">
            <IconShield size={18} />
          </div>
          <div className="lbl">SLA on-time</div>
          <div className="val">{slaPct}%</div>
          <div className="split">pending within 2h</div>
        </div>
      </div>

      {/* ── overdue alert ── */}
      {m.overdue.length > 0 && tab !== "pending" && (
        <button className="pd-rx-alert" onClick={() => setTab("pending")}>
          <IconAlert size={16} />{" "}
          <b>
            {m.overdue.length} prescription{m.overdue.length > 1 ? "s" : ""}
          </b>{" "}
          waiting more than {RX_SLA_MINS / 60}h — review now <IconArrowRight size={14} />
        </button>
      )}

      {/* ── insights ── */}
      <div className="pd-rx-insights">
        <div className="pd-card pd-card-pad">
          <div className="pd-rx-inhead">
            <IconStethoscope size={15} /> Top prescribers
          </div>
          {m.topDoctors.length === 0 ? (
            <p className="pd-muted" style={{ fontSize: 12.5 }}>
              No data yet.
            </p>
          ) : (
            m.topDoctors.map(([doc, n]) => {
              const max = m.topDoctors[0][1] || 1;
              return (
                <div key={doc} style={{ marginBottom: 9 }}>
                  <div
                    className="pd-flex"
                    style={{ justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}
                  >
                    <span>{doc}</span>
                    <b>{n} Rx</b>
                  </div>
                  <div className="pd-prog">
                    <i style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="pd-card pd-card-pad">
          <div className="pd-rx-inhead">
            <IconChart size={15} /> Source &amp; compliance
          </div>
          <div className="pd-rx-splitbar" aria-hidden>
            <span className="dig" style={{ width: `${digitalPct}%` }} />
            <span className="upl" style={{ width: `${100 - digitalPct}%` }} />
          </div>
          <div className="pd-rx-legend">
            <span>
              <i className="dig" /> Digital {m.digital}
            </span>
            <span>
              <i className="upl" /> Uploaded {m.uploaded}
            </span>
          </div>
          <div className="pd-rx-facts">
            <div>
              <span>Within SLA</span>
              <b>
                {m.pending.length - m.overdue.length}/{m.pending.length || 0}
              </b>
            </div>
            <div>
              <span>Avg turnaround</span>
              <b>{fmtMins(m.avgTurn)}</b>
            </div>
            <div>
              <span>Dispensed</span>
              <b>{m.dispensed.length}</b>
            </div>
            <div>
              <span>Rejected</span>
              <b>{counts("rejected")}</b>
            </div>
          </div>
        </div>
      </div>

      {/* ── toolbar ── */}
      <div className="pd-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        <div className="pd-seg">
          {TABS.map((t) => (
            <button key={t.k} className={tab === t.k ? "on" : ""} onClick={() => setTab(t.k)}>
              {t.label}
              {t.n != null ? ` (${t.n})` : ""}
            </button>
          ))}
        </div>
        <div className="pd-spacer" />
        <div className="pd-seg">
          <button className={kind === "all" ? "on" : ""} onClick={() => setKind("all")}>
            All sources
          </button>
          <button className={kind === "digital" ? "on" : ""} onClick={() => setKind("digital")}>
            Digital
          </button>
          <button className={kind === "uploaded" ? "on" : ""} onClick={() => setKind("uploaded")}>
            Uploaded
          </button>
        </div>
        <div className="pd-search" style={{ maxWidth: 240 }}>
          <IconSearch size={15} />
          <input
            placeholder="Search patient, doctor, Rx no…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="pd-card pd-card-pad">
          <div className="pd-empty">
            <div className="em">
              <IconDoc size={28} />
            </div>
            <h3>Nothing here</h3>
            <p>No prescriptions match this view.</p>
          </div>
        </div>
      ) : (
        <div className="pd-rx-grid">
          {list.map((r) => (
            <RxCard
              key={r.id}
              r={r}
              now={now}
              inventory={inventory}
              onOpen={() => setOpen(r)}
              onApprove={() => approveRx(r.id)}
              onReject={() => setRejecting(r)}
              onDispense={() => dispenseRx(r.id)}
            />
          ))}
        </div>
      )}

      {open && (
        <RxDetail
          rx={open}
          inventory={inventory}
          now={now}
          onClose={() => setOpen(null)}
          onApprove={() => {
            approveRx(open.id);
            setOpen(null);
          }}
          onReject={() => {
            setRejecting(open);
            setOpen(null);
          }}
          onDispense={() => {
            dispenseRx(open.id);
            setOpen(null);
          }}
        />
      )}

      {rejecting && (
        <RejectModal
          rx={rejecting}
          onClose={() => setRejecting(null)}
          onConfirm={(reason) => {
            rejectRx(rejecting.id, reason);
            setRejecting(null);
          }}
        />
      )}
    </div>
  );
}

// ══════════════════ card ══════════════════

// ══════════════════ detail modal ══════════════════

// ══════════════════ reject modal ══════════════════
