import { useState } from "react";
import {
  inr,
  fmtDateTime,
  timeAgo,
  custKeyOf,
  catLabel,
  computeInvoice,
  PAY_LABEL,
  BLOOD_GROUPS,
  Sale,
} from "@/utils";
import { PatientMed, Segment, segLabel, TIERS, crmMsg } from "@/utils/calculations/crm";
import {
  IconX,
  IconWhatsApp,
  IconMessage,
  IconCheck,
  IconUser,
  IconClock,
  IconGift,
  IconStar,
  IconHeart,
  IconMail,
  IconPhone,
  IconReceipt,
  IconPill,
} from "@/components/Icon";

import { wa } from "@/screens/Crm/components/wa";
import { PtSpark } from "@/screens/Crm/components/PtSpark";

const GENDERS = ["Male", "Female", "Other"];

export function PatientModal(props: any) {
  const {
    p,
    onClose,
    profile,
    sales,
    crm,
    setPatientMeta,
    redeemPoints,
    redeemedBy,
    logReminder,
    now,
  } = props;
  const meta = p.meta ?? {};
  const avail = Math.max(0, p.points - (redeemedBy.get(p.key) ?? 0));
  const redeemed = redeemedBy.get(p.key) ?? 0;

  const hist: Sale[] = sales
    .filter((s: Sale) => s.status !== "cancelled" && custKeyOf(s.customer) === p.key)
    .sort((a: Sale, b: Sale) => b.createdAt - a.createdAt);
  const orderTotal = (s: Sale) => computeInvoice(s.items, s.discount).payable;
  const spendSeries = [...hist].reverse().map(orderTotal);
  const ptReminders = crm.reminders.filter((r: any) => r.custKey === p.key);
  const ptFeedback = crm.feedbacks.filter((f: any) => f.custKey === p.key);
  const ptRedemptions = crm.redemptions.filter((r: any) => r.custKey === p.key);

  const curMin = TIERS.find((t) => t.tier === p.tier)!.min;
  const nextTier = [...TIERS].filter((t) => t.min > p.points).sort((a, b) => a.min - b.min)[0];
  const tierProg = nextTier
    ? Math.min(100, Math.max(0, ((p.points - curMin) / (nextTier.min - curMin)) * 100))
    : 100;
  const initials = p.name
    .split(" ")
    .filter(Boolean)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [f, setF] = useState({
    age: meta.age?.toString() ?? "",
    gender: meta.gender ?? "",
    bloodGroup: meta.bloodGroup ?? "",
    dob: meta.dob ?? "",
    address: meta.address ?? "",
    conditions: (meta.conditions ?? []).join(", "),
    allergies: (meta.allergies ?? []).join(", "),
    note: meta.note ?? "",
    consent: meta.consent ?? false,
  });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const saveMeta = () =>
    setPatientMeta(p.key, {
      age: f.age ? Number(f.age) : undefined,
      gender: f.gender || undefined,
      bloodGroup: f.bloodGroup || undefined,
      dob: f.dob || undefined,
      address: f.address.trim() || undefined,
      conditions: f.conditions
        .split(",")
        .map((x: string) => x.trim())
        .filter(Boolean),
      allergies: f.allergies
        .split(",")
        .map((x: string) => x.trim())
        .filter(Boolean),
      note: f.note.trim() || undefined,
      consent: f.consent,
    });

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <div className="pd-pt-head">
            <span className="pd-pt-ava">{initials || <IconUser size={22} />}</span>
            <div>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {p.name} <span className="pd-pill pill-gold">{p.tier}</span>
                {p.chronic && <span className="pd-pill pill-rose">chronic</span>}
              </h3>
              <div
                className="pd-muted"
                style={{ fontSize: 12.5, marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}
              >
                <span>
                  <IconPhone size={11} /> {p.phone || "—"}
                </span>
                {p.email && (
                  <span>
                    <IconMail size={11} /> {p.email}
                  </span>
                )}
                <span>
                  <IconClock size={11} />{" "}
                  {p.daysSince === 0 ? "seen today" : `last seen ${timeAgo(p.lastAt, now)}`}
                </span>
              </div>
            </div>
          </div>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <div className="pd-modal-body pd-pt-body">
          {/* segments + quick actions */}
          <div className="pd-flex" style={{ gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {p.segments.map((g: Segment) => (
              <span key={g} className="pd-pill pill-green">
                {segLabel(g)}
              </span>
            ))}
            {p.refill && (
              <span className={`pd-pill ${p.refill.daysLeft <= 0 ? "pill-rose" : "pill-gold"}`}>
                Refill {p.refill.daysLeft <= 0 ? "overdue" : `in ${p.refill.daysLeft}d`}:{" "}
                {p.refill.med}
              </span>
            )}
          </div>
          <div className="pd-flex" style={{ gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            <button
              className="pd-btn pd-btn-primary pd-btn-sm"
              disabled={!p.phone}
              onClick={() => wa(p.phone, crmMsg.feedback(p.name, profile.name))}
            >
              <IconWhatsApp size={14} /> WhatsApp
            </button>
            {p.phone && (
              <a className="pd-btn pd-btn-ghost pd-btn-sm" href={`tel:${p.phone}`}>
                <IconPhone size={14} /> Call
              </a>
            )}
            {p.refill && (
              <button
                className="pd-btn pd-btn-ghost pd-btn-sm"
                disabled={!p.phone}
                onClick={() => {
                  wa(p.phone, crmMsg.refill(p.name, profile.name, p.refill.med));
                  logReminder({
                    custKey: p.key,
                    custName: p.name,
                    kind: "refill",
                    channel: "whatsapp",
                  });
                }}
              >
                <IconClock size={14} /> Refill reminder
              </button>
            )}
            <button
              className="pd-btn pd-btn-ghost pd-btn-sm"
              disabled={!p.phone}
              onClick={() => {
                wa(p.phone, crmMsg.winback(p.name, profile.name));
                logReminder({
                  custKey: p.key,
                  custName: p.name,
                  kind: "winback",
                  channel: "whatsapp",
                });
              }}
            >
              <IconHeart size={14} /> Win-back
            </button>
            <button
              className="pd-btn pd-btn-ghost pd-btn-sm"
              disabled={avail <= 0}
              onClick={() => redeemPoints(p.key, p.name, Math.min(avail, 50))}
            >
              <IconGift size={14} /> Redeem 50
            </button>
            <button
              className="pd-btn pd-btn-ghost pd-btn-sm"
              onClick={() => {
                onClose();
                props.go("pos");
              }}
            >
              <IconReceipt size={14} /> New sale
            </button>
          </div>

          {/* KPI tiles */}
          <div className="pd-pt-kpis">
            <div className="k">
              <span className="l">Lifetime spend</span>
              <span className="v">{inr(p.spent)}</span>
            </div>
            <div className="k">
              <span className="l">Orders</span>
              <span className="v">{p.orders}</span>
            </div>
            <div className="k">
              <span className="l">Avg order</span>
              <span className="v">{inr(p.avgOrder)}</span>
            </div>
            <div className="k">
              <span className="l">Units bought</span>
              <span className="v">{p.units}</span>
            </div>
            <div className="k">
              <span className="l">Points available</span>
              <span className="v">{avail}</span>
            </div>
            <div className="k">
              <span className="l">RFM score</span>
              <span className="v">
                {p.rfm.score}
                <small> /15</small>
              </span>
            </div>
            <div className="k">
              <span className="l">First visit</span>
              <span className="v sm">{fmtDateTime(p.firstAt).split(",")[0]}</span>
            </div>
            <div className="k">
              <span className="l">Days since</span>
              <span className="v">
                {p.daysSince}
                <small>d</small>
              </span>
            </div>
          </div>

          {spendSeries.length >= 2 && (
            <div className="pd-card pd-card-pad" style={{ marginBottom: 14 }}>
              <div className="pd-flex" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <b style={{ fontSize: 12.5 }}>Spend per visit</b>
                <span className="pd-muted" style={{ fontSize: 11.5 }}>
                  {spendSeries.length} visits · online {p.onlineOrders}/{p.orders}
                </span>
              </div>
              <PtSpark data={spendSeries} />
            </div>
          )}

          <div className="pd-grid-2">
            {/* medicines bought */}
            <div>
              <div className="pd-pl-head" style={{ marginTop: 0 }}>
                Medicines bought{" "}
                <span className="pd-muted" style={{ fontWeight: 500, fontSize: 12 }}>
                  · {p.medicines.length}
                </span>
              </div>
              <div className="pd-card" style={{ overflow: "hidden" }}>
                {p.medicines.length === 0 ? (
                  <div className="pd-empty" style={{ padding: 16 }}>
                    <p>—</p>
                  </div>
                ) : (
                  p.medicines.slice(0, 8).map((m: PatientMed) => (
                    <div className="pd-medrow" key={m.productId}>
                      <span className="em">
                        <IconPill size={14} />
                      </span>
                      <span className="gw">
                        <div className="t">{m.name}</div>
                        <div className="s">
                          {catLabel(m.category)} · {m.orders}× · last {timeAgo(m.lastAt, now)}
                        </div>
                      </span>
                      <span className="pd-pill pill-gray">{m.qty} u</span>
                    </div>
                  ))
                )}
              </div>
              {p.categories.length > 0 && (
                <div className="pd-flex" style={{ gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                  {p.categories.map((c: string) => (
                    <span key={c} className="pd-pill pill-gray" style={{ fontSize: 11 }}>
                      {catLabel(c)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* purchase history */}
            <div>
              <div className="pd-pl-head" style={{ marginTop: 0 }}>
                Purchase history{" "}
                <span className="pd-muted" style={{ fontWeight: 500, fontSize: 12 }}>
                  · {hist.length}
                </span>
              </div>
              <div
                className="pd-card"
                style={{ overflow: "hidden", maxHeight: 260, overflowY: "auto" }}
              >
                {hist.length === 0 ? (
                  <div className="pd-empty" style={{ padding: 16 }}>
                    <p>No purchases.</p>
                  </div>
                ) : (
                  hist.slice(0, 20).map((s: Sale) => (
                    <div className="pd-medrow" key={s.id}>
                      <span className="em">
                        <IconReceipt size={14} />
                      </span>
                      <span className="gw">
                        <div className="t pd-mono">
                          {s.id}{" "}
                          {s.paid === false && (
                            <span className="pd-pill pill-rose" style={{ fontSize: 10 }}>
                              unpaid
                            </span>
                          )}
                        </div>
                        <div className="s">
                          {fmtDateTime(s.createdAt)} · {s.items.reduce((a, i) => a + i.qty, 0)}{" "}
                          items · {s.channel === "online" ? "Online" : "Counter"} ·{" "}
                          {PAY_LABEL[s.payMode]}
                        </div>
                      </span>
                      <span style={{ fontWeight: 800, fontSize: 13 }}>{inr(orderTotal(s))}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* loyalty */}
          <div className="pd-pl-head">Loyalty &amp; tier</div>
          <div className="pd-card pd-card-pad" style={{ marginBottom: 12 }}>
            <div
              className="pd-flex"
              style={{ justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}
            >
              <span>
                <b className="pd-pill pill-gold">{p.tier}</b> · {p.points} pts earned · {redeemed}{" "}
                redeemed
              </span>
              <span className="pd-muted">
                {nextTier
                  ? `${nextTier.min - p.points} pts to ${nextTier.tier}`
                  : "Top tier reached"}
              </span>
            </div>
            <div className="pd-tierbar">
              <i style={{ width: `${tierProg}%` }} />
            </div>
            {ptRedemptions.length > 0 && (
              <div className="pd-muted" style={{ fontSize: 11.5, marginTop: 8 }}>
                Recent:{" "}
                {ptRedemptions
                  .slice(0, 3)
                  .map((r: any) => `${r.points} pts (${inr(r.value)})`)
                  .join(" · ")}
              </div>
            )}
          </div>

          {/* clinical + personal */}
          <div className="pd-pl-head">Clinical &amp; personal profile</div>
          <div className="pd-form-grid" style={{ marginBottom: 10 }}>
            <div className="pd-field">
              <label>Age</label>
              <input
                className="pd-input"
                type="number"
                value={f.age}
                onChange={(e) => set({ age: e.target.value })}
                placeholder="—"
              />
            </div>
            <div className="pd-field">
              <label>Gender</label>
              <select
                className="pd-select"
                value={f.gender}
                onChange={(e) => set({ gender: e.target.value })}
              >
                <option value="">—</option>
                {GENDERS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="pd-field">
              <label>Blood group</label>
              <select
                className="pd-select"
                value={f.bloodGroup}
                onChange={(e) => set({ bloodGroup: e.target.value })}
              >
                <option value="">—</option>
                {BLOOD_GROUPS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="pd-field">
              <label>Date of birth</label>
              <input
                className="pd-input"
                type="date"
                value={f.dob}
                onChange={(e) => set({ dob: e.target.value })}
              />
            </div>
            <div className="pd-field pd-span2">
              <label>Conditions (comma-sep)</label>
              <input
                className="pd-input"
                value={f.conditions}
                onChange={(e) => set({ conditions: e.target.value })}
                placeholder="e.g. Diabetes, Hypertension"
              />
            </div>
            <div className="pd-field pd-span2">
              <label>Allergies</label>
              <input
                className="pd-input"
                value={f.allergies}
                onChange={(e) => set({ allergies: e.target.value })}
                placeholder="e.g. Penicillin, Sulfa"
              />
            </div>
            <div className="pd-field pd-span2">
              <label>Address</label>
              <input
                className="pd-input"
                value={f.address}
                onChange={(e) => set({ address: e.target.value })}
                placeholder="Delivery / home address"
              />
            </div>
            <div className="pd-field pd-span2">
              <label>Care note</label>
              <input
                className="pd-input"
                value={f.note}
                onChange={(e) => set({ note: e.target.value })}
                placeholder="Anything to remember for this patient…"
              />
            </div>
          </div>
          <label
            className="pd-flex pd-gap6"
            style={{ cursor: "pointer", fontSize: 12.5, marginBottom: 10 }}
          >
            <input
              type="checkbox"
              checked={f.consent}
              onChange={(e) => set({ consent: e.target.checked })}
            />{" "}
            Consent to WhatsApp/SMS reminders &amp; offers
          </label>
          <button className="pd-btn pd-btn-primary pd-btn-sm" onClick={saveMeta}>
            <IconCheck size={14} /> Save profile
          </button>

          {/* engagement history */}
          {(ptReminders.length > 0 || ptFeedback.length > 0) && (
            <>
              <div className="pd-pl-head">Engagement history</div>
              <div className="pd-grid-2">
                <div className="pd-card" style={{ overflow: "hidden" }}>
                  <div className="pd-card-head">
                    <h3 style={{ fontSize: 13 }}>Reminders sent</h3>
                    <span className="sub">{ptReminders.length}</span>
                  </div>
                  <div className="pd-card-pad" style={{ paddingTop: 4 }}>
                    {ptReminders.length === 0 ? (
                      <p className="pd-muted" style={{ fontSize: 12 }}>
                        None yet.
                      </p>
                    ) : (
                      ptReminders.slice(0, 5).map((r: any) => (
                        <div className="pd-medrow" key={r.id}>
                          <span className="em">
                            <IconMessage size={13} />
                          </span>
                          <span className="gw">
                            <div className="t" style={{ textTransform: "capitalize" }}>
                              {r.kind}
                            </div>
                            <div className="s">{r.channel}</div>
                          </span>
                          <span className="pd-muted" style={{ fontSize: 11 }}>
                            {timeAgo(r.at, now)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="pd-card" style={{ overflow: "hidden" }}>
                  <div className="pd-card-head">
                    <h3 style={{ fontSize: 13 }}>Feedback</h3>
                    <span className="sub">{ptFeedback.length}</span>
                  </div>
                  <div className="pd-card-pad" style={{ paddingTop: 4 }}>
                    {ptFeedback.length === 0 ? (
                      <p className="pd-muted" style={{ fontSize: 12 }}>
                        None yet.
                      </p>
                    ) : (
                      ptFeedback.slice(0, 5).map((fb: any) => (
                        <div className="pd-medrow" key={fb.id}>
                          <span className="pd-rating gold">
                            {[1, 2, 3, 4, 5].slice(0, fb.rating).map((n) => (
                              <IconStar key={n} size={12} />
                            ))}
                          </span>
                          <span className="gw">
                            <div className="t">{fb.comment || "—"}</div>
                            <div className="s">{fb.nps != null ? `NPS ${fb.nps}` : ""}</div>
                          </span>
                          <span className="pd-muted" style={{ fontSize: 11 }}>
                            {timeAgo(fb.at, now)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="pd-modal-foot">
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Close
          </button>
          <button
            className="pd-btn pd-btn-primary"
            onClick={() => {
              onClose();
              props.go("pos");
            }}
          >
            <IconReceipt size={15} /> New sale
          </button>
        </div>
      </div>
    </div>
  );
}
