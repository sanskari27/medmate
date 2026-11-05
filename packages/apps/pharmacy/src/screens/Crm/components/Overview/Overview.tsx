import { inr, timeAgo } from "@/utils";
import { Patient, SEGMENTS, refillsDue, atRisk, crmMsg } from "@/utils/calculations/crm";
import {
  IconWhatsApp,
  IconCheck,
  IconUser,
  IconAlert,
  IconClock,
  IconGift,
  IconStar,
  IconSparkle,
} from "@/components/Icon";
import { SegmentIcon } from "@/components/entityIcon";

import { wa } from "@/screens/Crm/components/wa";

export function Overview(s: any) {
  const { patients, openPatient } = s;
  const active = patients.filter((p: Patient) => p.daysSince <= 30).length;
  const risk = atRisk(patients);
  const dueSoon = refillsDue(patients, 7);
  const pts = patients.reduce(
    (a: number, p: Patient) => a + Math.max(0, p.points - (s.redeemedBy.get(p.key) ?? 0)),
    0,
  );
  const fb = s.crm.feedbacks;
  const avg = fb.length ? fb.reduce((a: number, f: any) => a + f.rating, 0) / fb.length : 0;
  const dist = SEGMENTS.map((seg) => ({
    seg,
    n: patients.filter((p: Patient) => p.segments.includes(seg.key)).length,
  }));
  const maxN = Math.max(1, ...dist.map((d) => d.n));

  return (
    <>
      <div className="pd-stats">
        <div className="pd-stat">
          <div className="ic ic-green">
            <IconUser size={18} />
          </div>
          <div className="lbl">Patients</div>
          <div className="val">{patients.length}</div>
          <div className="split">total on file</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-blue">
            <IconCheck size={18} />
          </div>
          <div className="lbl">Active (30d)</div>
          <div className="val">{active}</div>
          <div className="split">ordered recently</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-rose">
            <IconAlert size={18} />
          </div>
          <div className="lbl">At-risk</div>
          <div className="val">{risk.length}</div>
          <div className="split">churn candidates</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-gold">
            <IconClock size={18} />
          </div>
          <div className="lbl">Refills due (7d)</div>
          <div className="val">{dueSoon.length}</div>
          <div className="split">medicines to reorder</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-gold">
            <IconGift size={18} />
          </div>
          <div className="lbl">Loyalty points</div>
          <div className="val">{pts.toLocaleString("en-IN")}</div>
          <div className="split">redeemable rewards</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-green">
            <IconStar size={18} />
          </div>
          <div className="lbl">Avg rating</div>
          <div className="val">{avg ? avg.toFixed(1) : "—"}</div>
          <div className="split">out of 5</div>
        </div>
      </div>

      <div className="pd-grid-2">
        <div className="pd-card">
          <div className="pd-card-head">
            <h3>Refills due this week</h3>
            <span className="sub">chronic care</span>
          </div>
          <div className="pd-card-pad">
            {dueSoon.length === 0 ? (
              <div className="pd-empty" style={{ padding: 16 }}>
                <p>No refills due in 7 days.</p>
              </div>
            ) : (
              dueSoon.slice(0, 6).map((p: Patient) => (
                <div
                  className="pd-row"
                  key={p.key}
                  style={{ cursor: "pointer" }}
                  onClick={() => openPatient(p.key)}
                >
                  <span className="em">
                    <IconClock size={15} />
                  </span>
                  <span className="gw">
                    <div className="t">{p.name}</div>
                    <div className="s">{p.refill!.med}</div>
                  </span>
                  <span
                    className={`pd-pill ${p.refill!.daysLeft <= 0 ? "pill-rose" : "pill-gold"}`}
                  >
                    {p.refill!.daysLeft <= 0 ? "Overdue" : `${p.refill!.daysLeft}d`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="pd-card">
          <div className="pd-card-head">
            <h3>Segment distribution</h3>
          </div>
          <div className="pd-card-pad">
            {dist.map((d) => (
              <div key={d.seg.key} style={{ marginBottom: 10 }}>
                <div
                  className="pd-flex"
                  style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}
                >
                  <span className="pd-hstack" style={{ gap: 6 }}>
                    <SegmentIcon k={d.seg.key} size={14} /> {d.seg.label}
                  </span>
                  <b>{d.n}</b>
                </div>
                <div className="pd-prog">
                  <i style={{ width: `${(d.n / maxN) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pd-card" style={{ marginTop: 16 }}>
        <div className="pd-card-head">
          <h3>At-risk / lapsed patients</h3>
          <span className="sub">no purchase in 60+ days</span>
        </div>
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Phone</th>
                <th className="num">Orders</th>
                <th className="num">Lifetime</th>
                <th>Last seen</th>
                <th>Win back</th>
              </tr>
            </thead>
            <tbody>
              {risk.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="pd-empty">
                      <div className="em">
                        <IconSparkle size={30} />
                      </div>
                      <p>No at-risk patients — great retention!</p>
                    </div>
                  </td>
                </tr>
              )}
              {risk.slice(0, 8).map((p: Patient) => (
                <tr key={p.key} style={{ cursor: "pointer" }} onClick={() => openPatient(p.key)}>
                  <td>
                    <div className="prod">
                      <span className="em">
                        <IconUser size={15} />
                      </span>
                      <span className="nm">{p.name}</span>
                    </div>
                  </td>
                  <td className="pd-mono">{p.phone || "—"}</td>
                  <td className="num">{p.orders}</td>
                  <td className="num">{inr(p.spent)}</td>
                  <td>{timeAgo(p.lastAt, s.now)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="pd-btn pd-btn-ghost"
                      disabled={!p.phone}
                      onClick={() => {
                        wa(p.phone, crmMsg.winback(p.name, s.profile.name));
                        s.logReminder({
                          custKey: p.key,
                          custName: p.name,
                          kind: "winback",
                          channel: "whatsapp",
                        });
                      }}
                    >
                      <IconWhatsApp size={14} /> Win back
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
