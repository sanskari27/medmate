import { useMemo, useState } from "react";
import { usePharma } from "@/store/slices/session";
import { inr, catLabel, Sale, PayMode, PAY_LABEL, SaleSource, saleSourceOf } from "@/utils";
import { IconDonut, IconBars, IconTrendUp } from "@/components/Icon";

import { saleTotal } from "@/screens/Dashboard/components/saleTotal";
import { inrK } from "@/screens/Dashboard/components/inrK";
import { TrendChart } from "@/screens/Dashboard/components/TrendChart";
import { DonutChart } from "@/screens/Dashboard/components/DonutChart";
import { HBar } from "@/screens/Dashboard/components/HBar";

type Range = "7D" | "30D" | "12M";

type Metric = "revenue" | "orders";

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DAY = 86400000;

const SRC_COLOR: Record<SaleSource, string> = {
  opd: "var(--blue)",
  counter: "var(--gold)",
  ward: "var(--rose)",
  emergency: "var(--amber)",
  online: "var(--mid)",
};

const SRC_ORDER: SaleSource[] = ["online", "counter", "ward", "emergency", "opd"];

const SRC_LABEL: Record<SaleSource, string> = {
  online: "Online",
  counter: "Counter sale",
  ward: "Ward sale",
  emergency: "Emergency sale",
  opd: "OPD Rx",
};

type ChartType = "donut" | "group" | "line";

const CHART_OPTS: {
  k: ChartType;
  label: string;
  Icon: (p: { size?: number }) => React.ReactNode;
}[] = [
  { k: "donut", label: "Donut", Icon: IconDonut },
  { k: "group", label: "Grouped bars", Icon: IconBars },
  { k: "line", label: "Line", Icon: IconTrendUp },
];

type Series = { key: SaleSource; label: string; color: string; rev: number[]; ord: number[] };

export function SalesAnalytics({
  sales,
  inventory,
  now,
  onlineRev,
  offlineRev,
  isHospital,
}: {
  sales: Sale[];
  inventory: ReturnType<typeof usePharma>["inventory"];
  now: number;
  onlineRev: number;
  offlineRev: number;
  isHospital: boolean;
}) {
  const [range, setRange] = useState<Range>("7D");
  const [metric, setMetric] = useState<Metric>("revenue");
  const [chart, setChart] = useState<ChartType>("donut");
  const srcOrder = useMemo(
    () => (isHospital ? SRC_ORDER : (["online", "counter"] as SaleSource[])),
    [isHospital],
  );
  const [hidden, setHidden] = useState<Set<SaleSource>>(new Set());

  const windowStart = now - (range === "7D" ? 7 : range === "30D" ? 30 : 365) * DAY;
  const realSales = useMemo(
    () => sales.filter((s) => s.status !== "cancelled" && s.createdAt >= windowStart),
    [sales, windowStart],
  );

  // real share of each source in the window (grounds the synthetic trend in actual mix)
  const srcRows = useMemo(() => {
    const m: Record<string, number> = {};
    realSales.forEach((s) => {
      const k = isHospital ? saleSourceOf(s) : s.channel === "online" ? "online" : "counter";
      m[k] = (m[k] || 0) + saleTotal(s);
    });
    return srcOrder.map((k) => ({ key: k, label: SRC_LABEL[k], amt: m[k] || 0 }));
  }, [realSales, isHospital, srcOrder]);
  const srcRealTotal = srcRows.reduce((a, r) => a + r.amt, 0);

  // ── per-source trend series (deterministic waves × real share, last 7D bucket anchored to today) ──
  const { labels, series } = useMemo(() => {
    const labels: string[] = [];
    if (range === "7D")
      for (let i = 6; i >= 0; i--) labels.push(WD[new Date(now - i * DAY).getDay()]);
    else if (range === "30D")
      for (let i = 4; i >= 0; i--) labels.push(i === 0 ? "This wk" : i + "w ago");
    else
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        labels.push(MO[d.getMonth()]);
      }

    const totalBase = range === "7D" ? 11500 : range === "30D" ? 76000 : 330000;
    const share = (k: SaleSource, i: number) =>
      srcRealTotal > 0 ? srcRows[i].amt / srcRealTotal : 1 / srcOrder.length;
    const wave = (k: number) =>
      0.55 +
      0.45 * (((Math.sin(k * 0.9) + 1) / 2) * 0.6 + ((Math.sin(k * 0.5 + 1.3) + 1) / 2) * 0.4);
    const TICKET = range === "7D" ? 430 : range === "30D" ? 445 : 455;

    const series: Series[] = srcOrder.map((k, si) => {
      const base = totalBase * share(k, si);
      const rev = labels.map((_, i) => Math.round(base * wave(i + si * 1.7)));
      if (range === "7D") {
        // anchor the latest bucket to today's real figures where we have them
        if (k === "online" && onlineRev > 0) rev[rev.length - 1] = onlineRev;
        if (k === "counter" && offlineRev > 0) rev[rev.length - 1] = offlineRev;
      }
      const ord = rev.map((v) => Math.max(v > 0 ? 1 : 0, Math.round(v / TICKET)));
      return { key: k, label: SRC_LABEL[k], color: SRC_COLOR[k], rev, ord };
    });
    return { labels, series };
  }, [range, now, srcRows, srcRealTotal, srcOrder, onlineRev, offlineRev]);

  const visible = series.filter((s) => !hidden.has(s.key));
  const val = (s: Series, i: number) => (metric === "revenue" ? s.rev[i] : s.ord[i]);
  const totals = labels.map((_, i) => visible.reduce((a, s) => a + val(s, i), 0));
  const sumTot = totals.reduce((a, b) => a + b, 0);
  const fmt = (n: number) => (metric === "revenue" ? inr(n) : `${n}`);
  const fmtAxis = (n: number) => (metric === "revenue" ? inrK(n) : `${Math.round(n)}`);

  // donut = composition over the window (per visible source), synthetic total to match the trend
  const donutRows = visible.map((s) => ({
    key: s.key,
    label: s.label,
    color: s.color,
    amt: s.rev.reduce((a, b) => a + b, 0),
    amtOrd: s.ord.reduce((a, b) => a + b, 0),
  }));

  // ── real breakdowns (payment + categories) ──
  const payRows = useMemo(() => {
    const m: Record<string, number> = {};
    realSales.forEach((s) => {
      m[s.payMode] = (m[s.payMode] || 0) + saleTotal(s);
    });
    const tot = Object.values(m).reduce((a, b) => a + b, 0) || 1;
    return (Object.keys(m) as PayMode[])
      .sort((a, b) => m[b] - m[a])
      .map((k) => ({ key: k, label: PAY_LABEL[k], amt: m[k], pct: (m[k] / tot) * 100 }));
  }, [realSales]);

  const catRows = useMemo(() => {
    const m: Record<string, number> = {};
    realSales.forEach((s) =>
      s.items.forEach((it) => {
        const cat = inventory.find((p) => p.id === it.productId)?.category ?? "other";
        m[cat] = (m[cat] || 0) + it.price * it.qty;
      }),
    );
    const max = Math.max(...Object.values(m), 1);
    return Object.keys(m)
      .sort((a, b) => m[b] - m[a])
      .slice(0, 5)
      .map((k) => ({ key: k, label: catLabel(k), amt: m[k], pct: (m[k] / max) * 100 }));
  }, [realSales, inventory]);

  const srcRealShownTotal = srcRows.reduce((a, r) => a + r.amt, 0) || 1;
  const rangeLabel =
    range === "7D" ? "last 7 days" : range === "30D" ? "last 5 weeks" : "last 12 months";
  const toggle = (k: SaleSource) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      if (n.size >= series.length) return h;
      return n;
    });

  return (
    <div>
      <div className="pd-card">
        <div className="pd-card-head" style={{ flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3>
              Sales analytics{" "}
              {isHospital && (
                <span className="pd-muted" style={{ fontWeight: 600, fontSize: 12 }}>
                  · all sources
                </span>
              )}
            </h3>
            <span className="pd-muted" style={{ fontSize: 12 }}>
              {metric === "revenue" ? inr(sumTot) : `${sumTot} orders`} · {rangeLabel}
            </span>
          </div>
          <div className="pd-flex" style={{ gap: 8, flexWrap: "wrap" }}>
            <div className="pd-seg">
              {(["revenue", "orders"] as Metric[]).map((m) => (
                <button
                  key={m}
                  className={metric === m ? "on" : ""}
                  style={{ textTransform: "capitalize" }}
                  onClick={() => setMetric(m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="pd-seg">
              {(["7D", "30D", "12M"] as Range[]).map((r) => (
                <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* chart-type picker */}
        <div className="pd-card-pad" style={{ paddingBottom: 0 }}>
          <div
            className="pd-flex"
            style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}
          >
            <div className="pd-seg">
              {CHART_OPTS.map((c) => (
                <button
                  key={c.k}
                  className={chart === c.k ? "on" : ""}
                  onClick={() => setChart(c.k)}
                  title={c.label}
                >
                  <span style={{ marginRight: 5, display: "inline-flex", verticalAlign: "-2px" }}>
                    {c.Icon({ size: 13 })}
                  </span>
                  {c.label}
                </button>
              ))}
            </div>
            {/* clickable source legend (show / hide series) */}
            <div className="pd-srcleg">
              {series.map((s) => (
                <button
                  key={s.key}
                  className={`chip${hidden.has(s.key) ? " off" : ""}`}
                  onClick={() => toggle(s.key)}
                  title={hidden.has(s.key) ? "Show" : "Hide"}
                >
                  <i style={{ background: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pd-card-pad">
          {chart === "donut" ? (
            <DonutChart
              rows={donutRows.map((r) => ({ ...r, amt: metric === "revenue" ? r.amt : r.amtOrd }))}
              fmt={fmt}
            />
          ) : (
            <TrendChart
              labels={labels}
              series={visible}
              type={chart}
              valOf={val}
              fmtAxis={fmtAxis}
              fmt={fmt}
            />
          )}
        </div>
      </div>

      {/* real breakdowns */}
      <div className="pd-grid-3" style={{ marginTop: 16 }}>
        <div className="pd-card">
          <div className="pd-card-head">
            <h3>{isHospital ? "Sales by source" : "Channel split"}</h3>
            <span className="sub">actual · {rangeLabel}</span>
          </div>
          <div className="pd-card-pad">
            <div
              style={{
                display: "flex",
                height: 14,
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 14,
                background: "var(--wash)",
              }}
            >
              {srcRows.map(
                (r) =>
                  r.amt > 0 && (
                    <div
                      key={r.key}
                      title={`${r.label} · ${inr(r.amt)}`}
                      style={{
                        width: `${(r.amt / srcRealShownTotal) * 100}%`,
                        background: SRC_COLOR[r.key as SaleSource],
                      }}
                    />
                  ),
              )}
            </div>
            {srcRows.map((r) => (
              <HBar
                key={r.key}
                label={r.label}
                right={`${inr(r.amt)} · ${Math.round((r.amt / srcRealShownTotal) * 100)}%`}
                pct={(r.amt / srcRealShownTotal) * 100}
                color={SRC_COLOR[r.key as SaleSource]}
              />
            ))}
          </div>
        </div>

        <div className="pd-card">
          <div className="pd-card-head">
            <h3>Payment modes</h3>
            <span className="sub">actual · {rangeLabel}</span>
          </div>
          <div className="pd-card-pad">
            {payRows.length === 0 ? (
              <div className="pd-empty" style={{ padding: "18px 8px" }}>
                <p>No sales in this window.</p>
              </div>
            ) : (
              payRows.map((r) => (
                <HBar
                  key={r.key}
                  label={r.label}
                  right={`${inr(r.amt)} · ${Math.round(r.pct)}%`}
                  pct={r.pct}
                  color="var(--green)"
                />
              ))
            )}
          </div>
        </div>

        <div className="pd-card">
          <div className="pd-card-head">
            <h3>Top categories</h3>
            <span className="sub">actual · {rangeLabel}</span>
          </div>
          <div className="pd-card-pad">
            {catRows.length === 0 ? (
              <div className="pd-empty" style={{ padding: "18px 8px" }}>
                <p>No sales in this window.</p>
              </div>
            ) : (
              catRows.map((r) => (
                <HBar
                  key={r.key}
                  label={r.label}
                  right={inr(r.amt)}
                  pct={r.pct}
                  color="var(--teal)"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
