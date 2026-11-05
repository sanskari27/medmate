import { saleTotal } from "@/screens/Dashboard/utils/saleTotal";
import { Spark } from "@/screens/Dashboard/components/Spark";
import { SalesAnalytics } from "@/screens/Dashboard/components/SalesAnalytics";
import { useMemo } from "react";
import { usePharma } from "@/hooks";
import {
  inr,
  isLowStock,
  isExpiringSoon,
  earliestBatch,
  monthsToExpiry,
  stockOf,
  timeAgo,
  catLabel,
  Sale,
} from "@/utils";
import { StatusPill } from "@/components/StatusPill";
import { Thumb } from "@/components/Thumb";
import {
  IconRupee,
  IconOrders,
  IconRx,
  IconAlert,
  IconArrowRight,
  IconCheck,
  IconGlobe,
  IconBox,
  IconCalendar,
  IconTrendUp,
  IconTrendDown,
  IconPos,
  IconTruck,
  IconSend,
  IconStore,
  IconStar,
} from "@/components/Icon";
import { monogramOf } from "@/components/EntityIcon";

const DAY_MS = 86400000;

export default function DashboardScreen() {
  const { sales, inventory, prescriptions, now, go, setInvFilter, isHospital, profile } =
    usePharma();
  const openAlerts = () => {
    setInvFilter("alerts");
    go("inventory");
  };
  const kpiKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todays = sales.filter((s) => s.createdAt >= today.getTime() && s.status !== "cancelled");
  const online = todays.filter((s) => s.channel === "online");
  const offline = todays.filter((s) => s.channel === "offline");
  const sum = (arr: Sale[]) => arr.reduce((a, s) => a + saleTotal(s), 0);
  const onlineRev = sum(online),
    offlineRev = sum(offline),
    totalRev = onlineRev + offlineRev;

  const newOrders = sales.filter((s) => s.channel === "online" && s.status === "new");
  const pendingRx = prescriptions.filter((r) => r.status === "pending");
  const lowStock = inventory.filter(isLowStock);
  const expiring = inventory
    .filter((p) => isExpiringSoon(p, now))
    .sort((a, b) => (earliestBatch(a)?.expiry ?? "").localeCompare(earliestBatch(b)?.expiry ?? ""));

  const recent = [...sales].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

  // ── smart extras: greeting, 7-day sparkline, delta, at-a-glance, top sellers ──
  const hour = new Date(now).getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const who = (profile.pharmacist || profile.name || "there").trim() || "there";
  const dateStr = new Date(now).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const dayTotals = useMemo(() => {
    const out: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d0 = new Date(now);
      d0.setHours(0, 0, 0, 0);
      d0.setDate(d0.getDate() - i);
      const a = d0.getTime(),
        b = a + DAY_MS;
      out.push(
        sales
          .filter((s) => s.status !== "cancelled" && s.createdAt >= a && s.createdAt < b)
          .reduce((x, s) => x + saleTotal(s), 0),
      );
    }
    return out;
  }, [sales, now]);
  const dayOrders = useMemo(() => {
    const out: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d0 = new Date(now);
      d0.setHours(0, 0, 0, 0);
      d0.setDate(d0.getDate() - i);
      const a = d0.getTime(),
        b = a + DAY_MS;
      out.push(
        sales.filter((s) => s.status !== "cancelled" && s.createdAt >= a && s.createdAt < b).length,
      );
    }
    return out;
  }, [sales, now]);
  const dayRx = useMemo(() => {
    const out: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d0 = new Date(now);
      d0.setHours(0, 0, 0, 0);
      d0.setDate(d0.getDate() - i);
      const a = d0.getTime(),
        b = a + DAY_MS;
      out.push(prescriptions.filter((r) => r.uploadedAt >= a && r.uploadedAt < b).length);
    }
    return out;
  }, [prescriptions, now]);
  const alertTotal = lowStock.length + expiring.length;
  const yday = dayTotals[5] ?? 0;
  const salesDelta =
    yday > 0 ? Math.round(((totalRev - yday) / yday) * 100) : totalRev > 0 ? 100 : 0;
  const itemsToday = todays.reduce((a, s) => a + s.items.reduce((x, i) => x + i.qty, 0), 0);
  const avgBill = todays.length ? Math.round(totalRev / todays.length) : 0;
  const dueCount = sales.filter((s) => s.paid === false && s.status !== "cancelled").length;
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRev = sales
    .filter((s) => s.status !== "cancelled" && s.createdAt >= monthStart.getTime())
    .reduce((a, s) => a + saleTotal(s), 0);

  const topSellers = useMemo(() => {
    const win = now - 7 * DAY_MS;
    const m: Record<string, { id: string; name: string; qty: number; rev: number }> = {};
    sales
      .filter((s) => s.status !== "cancelled" && s.createdAt >= win)
      .forEach((s) =>
        s.items.forEach((it) => {
          const e = m[it.productId] ?? { id: it.productId, name: it.name, qty: 0, rev: 0 };
          e.qty += it.qty;
          e.rev += it.price * it.qty;
          m[it.productId] = e;
        }),
      );
    return Object.values(m)
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);
  }, [sales, now]);
  const topMax = Math.max(...topSellers.map((t) => t.rev), 1);

  const QA = [
    { label: "New sale", sub: "Counter / POS", Icon: IconPos, go: () => go("pos") },
    { label: "New purchase", sub: "Goods inward", Icon: IconTruck, go: () => go("purchases") },
    {
      label: "Prescriptions",
      sub: pendingRx.length ? `${pendingRx.length} pending` : "All clear",
      Icon: IconRx,
      go: () => go("prescriptions"),
    },
    {
      label: "Reorder",
      sub: lowStock.length ? `${lowStock.length} low` : "Stock healthy",
      Icon: IconSend,
      go: () => go("reorder"),
    },
  ];

  return (
    <div className="pd-canvas-wide">
      {/* ── today strip + quick actions ── */}
      <div className="pd-hello">
        <div className="pd-hello-l">
          <div className="pd-hello-greet">
            {greet}, {who}
          </div>
          <div className="pd-hello-sub">
            {dateStr} ·{" "}
            <span className={`pd-dotpill ${profile.storeOpen ? "on" : "off"}`}>
              <i />
              {profile.storeOpen ? "Store open" : "Store paused"}
            </span>
          </div>
        </div>
        <div className="pd-qa">
          {QA.map((a) => (
            <button key={a.label} className="pd-qa-tile" onClick={a.go}>
              <span className="ic">
                <a.Icon size={16} />
              </span>
              <span className="tx">
                <b>{a.label}</b>
                <small>{a.sub}</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── metrics rail: context numbers, deliberately not competing cards ── */}
      <div className="pd-mini">
        <span>
          <small>This month</small>
          <b>{inr(monthRev)}</b>
        </span>
        <span>
          <small>Avg bill today</small>
          <b>{inr(avgBill)}</b>
        </span>
        <span>
          <small>Items sold today</small>
          <b>{itemsToday}</b>
        </span>
        {dueCount > 0 && (
          <span className="warn" role="button" onClick={() => go("khata")}>
            <small>Dues to collect</small>
            <b>{dueCount}</b>
          </span>
        )}
      </div>

      {/* ── KPI cards — each opens its section ── */}
      <div className="pd-stats">
        <div
          className="pd-stat link kpi accent-green"
          role="button"
          tabIndex={0}
          onClick={() => go("sales")}
          onKeyDown={kpiKey(() => go("sales"))}
          title="View all sales"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="kpi-top">
            <div className="ic ic-green">
              <IconRupee size={19} />
            </div>
            {salesDelta !== 0 && (
              <span className={`pd-trend ${salesDelta >= 0 ? "up" : "down"}`}>
                {salesDelta >= 0 ? <IconTrendUp size={12} /> : <IconTrendDown size={12} />}
                {Math.abs(salesDelta)}%
              </span>
            )}
          </div>
          <div className="lbl">Today’s sales</div>
          <div className="val">{inr(totalRev)}</div>
          <div className="pd-kpi-spark">
            <Spark data={dayTotals} />
          </div>
          <div className="split-pair">
            <span>
              <b>
                <IconGlobe size={12} /> {inr(onlineRev)}
              </b>
              <small>Online</small>
            </span>
            <span>
              <b>
                <IconStore size={12} /> {inr(offlineRev)}
              </b>
              <small>Counter</small>
            </span>
          </div>
        </div>
        <div
          className="pd-stat link kpi accent-blue"
          role="button"
          tabIndex={0}
          onClick={() => go("orders")}
          onKeyDown={kpiKey(() => go("orders"))}
          title="View orders"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="kpi-top">
            <div className="ic ic-blue">
              <IconOrders size={19} />
            </div>
            {newOrders.length > 0 && <span className="pd-trend gold">{newOrders.length} new</span>}
          </div>
          <div className="lbl">Orders today</div>
          <div className="val">{todays.length}</div>
          <div className="pd-kpi-spark">
            <Spark data={dayOrders} />
          </div>
          <div className="split">
            {newOrders.length > 0 ? (
              <>
                <b style={{ color: "var(--gold-d)" }}>{newOrders.length}</b> awaiting action
              </>
            ) : (
              <>
                <IconCheck size={12} /> all caught up
              </>
            )}
          </div>
        </div>
        <div
          className="pd-stat link kpi accent-gold"
          role="button"
          tabIndex={0}
          onClick={() => go("prescriptions")}
          onKeyDown={kpiKey(() => go("prescriptions"))}
          title="Review prescriptions"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="kpi-top">
            <div className="ic ic-gold">
              <IconRx size={19} />
            </div>
            {pendingRx.length > 0 && <span className="pd-trend gold">to verify</span>}
          </div>
          <div className="lbl">Prescriptions</div>
          <div className="val">{pendingRx.length}</div>
          <div className="pd-kpi-spark">
            <Spark data={dayRx} />
          </div>
          <div className="split">pending review</div>
        </div>
        <div
          className="pd-stat link kpi accent-rose"
          role="button"
          tabIndex={0}
          onClick={openAlerts}
          onKeyDown={kpiKey(openAlerts)}
          title="See medicines to reorder & expiring stock"
        >
          <span className="go">
            <IconArrowRight size={16} />
          </span>
          <div className="kpi-top">
            <div className="ic ic-rose">
              <IconAlert size={19} />
            </div>
            {lowStock.length + expiring.length > 0 && <span className="pd-trend down">action</span>}
          </div>
          <div className="lbl">Stock alerts</div>
          <div className="val">{lowStock.length + expiring.length}</div>
          <div className="pd-kpi-spark">
            {/* stock health mix — the same footprint as a sparkline, so the row stays uniform */}
            <div className="pd-healthbar">
              <i
                style={{
                  width: `${alertTotal ? (lowStock.length / alertTotal) * 100 : 0}%`,
                  background: "var(--gold)",
                }}
              />
              <i
                style={{
                  width: `${alertTotal ? (expiring.length / alertTotal) * 100 : 0}%`,
                  background: "var(--rose)",
                }}
              />
            </div>
            <div className="pd-healthkey">
              <span>
                <i style={{ background: "var(--gold)" }} />
                Low stock
              </span>
              <span>
                <i style={{ background: "var(--rose)" }} />
                Expiring
              </span>
            </div>
          </div>
          <div className="split-pair">
            <span>
              <b>{lowStock.length}</b>
              <small>Low stock</small>
            </span>
            <span>
              <b>{expiring.length}</b>
              <small>Expiring</small>
            </span>
          </div>
        </div>
      </div>

      {/* sales analytics (filterable) */}
      <div className="pd-grid-2" style={{ marginTop: 16 }}>
        <SalesAnalytics
          sales={sales}
          inventory={inventory}
          now={now}
          onlineRev={onlineRev}
          offlineRev={offlineRev}
          isHospital={isHospital}
        />
        {/* action queue */}
        <div className="pd-card">
          <div className="pd-card-head">
            <h3>Needs your attention</h3>
          </div>
          <div className="pd-card-pad" style={{ paddingTop: 4, paddingBottom: 6 }}>
            {newOrders.length === 0 && pendingRx.length === 0 && lowStock.length === 0 ? (
              <div className="pd-empty" style={{ padding: "26px 10px" }}>
                <div className="em">
                  <IconCheck size={30} />
                </div>
                <h3>All clear</h3>
                <p>No pending orders, prescriptions or stock alerts.</p>
              </div>
            ) : (
              <>
                {newOrders.slice(0, 2).map((o) => (
                  <div className="pd-row" key={o.id}>
                    <span className="em">
                      <IconGlobe size={18} />
                    </span>
                    <span className="gw">
                      <div className="t">New order {o.id}</div>
                      <div className="s">
                        {o.customer.name} · {o.items.length} items · {timeAgo(o.createdAt, now)}
                      </div>
                    </span>
                    <button
                      className="pd-btn pd-btn-sm pd-btn-primary"
                      onClick={() => go("orders")}
                    >
                      Review
                    </button>
                  </div>
                ))}
                {pendingRx.slice(0, 2).map((r) => (
                  <div className="pd-row" key={r.id}>
                    <span className="em">
                      <IconRx size={18} />
                    </span>
                    <span className="gw">
                      <div className="t">Prescription {r.id}</div>
                      <div className="s">
                        {r.patient} · Dr. uploaded {timeAgo(r.uploadedAt, now)}
                      </div>
                    </span>
                    <button
                      className="pd-btn pd-btn-sm pd-btn-ghost"
                      onClick={() => go("prescriptions")}
                    >
                      Verify
                    </button>
                  </div>
                ))}
                {lowStock.slice(0, 2).map((p) => (
                  <div className="pd-row" key={p.id}>
                    <span className="em">
                      <IconBox size={18} />
                    </span>
                    <span className="gw">
                      <div className="t">{p.name} running low</div>
                      <div className="s">
                        {stockOf(p)} left · reorder at {p.reorderLevel}
                      </div>
                    </span>
                    <button
                      className="pd-btn pd-btn-sm pd-btn-ghost"
                      onClick={() => go("inventory")}
                    >
                      Restock
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="pd-grid-3" style={{ marginTop: 16 }}>
        {/* expiring soon */}
        <div className="pd-card">
          <div className="pd-card-head">
            <h3>Expiring soon</h3>
            <button className="pd-btn pd-btn-sm pd-btn-ghost" onClick={() => go("inventory")}>
              Inventory <IconArrowRight size={14} />
            </button>
          </div>
          <div className="pd-card-pad" style={{ paddingTop: 4, paddingBottom: 6 }}>
            {expiring.length === 0 ? (
              <div className="pd-empty" style={{ padding: "26px 10px" }}>
                <div className="em">
                  <IconCalendar size={30} />
                </div>
                <p>No medicines expiring in the next 4 months.</p>
              </div>
            ) : (
              expiring.slice(0, 5).map((p) => {
                const b = earliestBatch(p)!;
                const mo = monthsToExpiry(b.expiry, now);
                const expired = mo < 0;
                return (
                  <div className="pd-row" key={p.id}>
                    <span className="em">{monogramOf(p.name)}</span>
                    <span className="gw">
                      <div className="t">{p.name}</div>
                      <div className="s">
                        Batch {b.batchNo} · {catLabel(p.category)} · {b.qty} units
                      </div>
                    </span>
                    <span className={`pd-pill ${expired ? "pill-rose" : "pill-gold"}`}>
                      {expired ? "Expired" : `${mo} mo · ${b.expiry}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="pd-card">
          <div className="pd-card-head">
            <h3>
              <IconStar size={15} /> Top sellers{" "}
              <span className="pd-muted" style={{ fontWeight: 600, fontSize: 12 }}>
                · last 7 days
              </span>
            </h3>
            <button className="pd-btn pd-btn-sm pd-btn-ghost" onClick={() => go("reports")}>
              Reports <IconArrowRight size={14} />
            </button>
          </div>
          <div className="pd-card-pad" style={{ paddingTop: 8 }}>
            {topSellers.length === 0 ? (
              <div className="pd-empty" style={{ padding: "24px 10px" }}>
                <div className="em">
                  <IconStar size={28} />
                </div>
                <p>No sales yet in the last 7 days.</p>
              </div>
            ) : (
              topSellers.map((t, i) => {
                const p = inventory.find((x) => x.id === t.id);
                return (
                  <div className="pd-sell" key={t.id}>
                    <span className="rk">{i + 1}</span>
                    <span className="em">{p ? <Thumb p={p} /> : <IconBox size={16} />}</span>
                    <div className="gw">
                      <div className="t">{t.name}</div>
                      <div className="track">
                        <i style={{ width: `${(t.rev / topMax) * 100}%` }} />
                      </div>
                    </div>
                    <div className="amt">
                      {inr(t.rev)}
                      <small>{t.qty} sold</small>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pd-card">
          <div className="pd-card-head">
            <h3>Recent transactions</h3>
            <button className="pd-btn pd-btn-sm pd-btn-ghost" onClick={() => go("orders")}>
              View all <IconArrowRight size={14} />
            </button>
          </div>
          <div className="pd-tbl-wrap">
            <table className="pd-tbl">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => go("orders")}>
                    <td className="pd-mono" style={{ fontWeight: 700 }}>
                      {s.id}
                    </td>
                    <td>
                      {s.customer.name}
                      <div className="s" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                        {timeAgo(s.createdAt, now)}
                      </div>
                    </td>
                    <td>
                      <StatusPill status={s.status} />
                    </td>
                    <td className="num" style={{ fontWeight: 800 }}>
                      {inr(saleTotal(s))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SVG time-series chart: grouped bars / line ──

// ── SVG donut: source composition ──
