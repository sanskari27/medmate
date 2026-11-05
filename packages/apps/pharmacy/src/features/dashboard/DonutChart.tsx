import { useMemo, useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  inr, computeInvoice, isLowStock, isExpiringSoon, earliestBatch, monthsToExpiry,
  stockOf, timeAgo, catLabel, Sale, PayMode, PAY_LABEL, SaleSource, saleSourceOf,
} from "@/domain";
import { StatusPill, ChannelPill, Thumb } from "@/components/bits";
import { IconRupee, IconOrders, IconRx, IconAlert, IconArrowRight, IconCheck, IconGlobe, IconBox, IconCalendar, IconDonut, IconBars, IconTrendUp, IconTrendDown, IconPos, IconTruck, IconSend, IconStore, IconStar } from "@/components/Icon"
import { monogramOf } from "@/components/entityIcon";

;

const DAY_MS = 86400000;

type Range = "7D" | "30D" | "12M";

type Ch = "all" | "online" | "offline";

type Metric = "revenue" | "orders";

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DAY = 86400000;

const SRC_COLOR: Record<SaleSource, string> = { opd: "var(--blue)", counter: "var(--gold)", ward: "var(--rose)", emergency: "var(--amber)", online: "var(--mid)" };

const SRC_ORDER: SaleSource[] = ["online", "counter", "ward", "emergency", "opd"];

const SRC_LABEL: Record<SaleSource, string> = { online: "Online", counter: "Counter sale", ward: "Ward sale", emergency: "Emergency sale", opd: "OPD Rx" };

type ChartType = "donut" | "group" | "line";

const CHART_OPTS: { k: ChartType; label: string; Icon: (p: { size?: number }) => React.ReactNode }[] = [
  { k: "donut", label: "Donut", Icon: IconDonut },
  { k: "group", label: "Grouped bars", Icon: IconBars },
  { k: "line", label: "Line", Icon: IconTrendUp },
];

type Series = { key: SaleSource; label: string; color: string; rev: number[]; ord: number[] };

export function DonutChart({ rows, fmt }: { rows: { key: string; label: string; color: string; amt: number }[]; fmt: (n: number) => string }) {
  const total = rows.reduce((a, r) => a + r.amt, 0);
  const R = 92, r = 56, cx = 110, cy = 110;
  const polar = (ang: number, rad: number) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
  let a0 = -Math.PI / 2;
  const arcs = rows.filter((x) => x.amt > 0).map((x) => {
    const frac = x.amt / (total || 1); const a1 = a0 + frac * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = polar(a0, R), [x1, y1] = polar(a1, R), [x2, y2] = polar(a1, r), [x3, y3] = polar(a0, r);
    const d = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r} ${r} 0 ${large} 0 ${x3} ${y3} Z`;
    a0 = a1;
    return { ...x, d, frac };
  });
  return (
    <div className="pd-flex" style={{ gap: 24, flexWrap: "wrap", alignItems: "center", justifyContent: "center", padding: "6px 0" }}>
      {total <= 0 ? <div className="pd-empty" style={{ padding: 30 }}><p>No data for the selected sources.</p></div> : (
        <>
          <svg viewBox="0 0 220 220" style={{ width: 260, height: 260, flexShrink: 0 }} role="img">
            {arcs.map((s) => <path key={s.key} d={s.d} fill={s.color}><title>{`${s.label}: ${fmt(s.amt)} · ${Math.round(s.frac * 100)}%`}</title></path>)}
            <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 19, fill: "var(--dark)" }}>{fmt(total)}</text>
            <text x={cx} y={cy + 15} textAnchor="middle" className="ax">total</text>
          </svg>
          <div style={{ minWidth: 210, maxWidth: 300, flex: "0 1 260px", background: "var(--wash2)", borderRadius: 12, padding: "10px 14px" }}>
            {arcs.map((s) => (
              <div className="pd-flex" key={s.key} style={{ justifyContent: "space-between", marginBottom: 9, fontSize: 12.5 }}>
                <span className="pd-flex" style={{ gap: 8, fontWeight: 600 }}><i style={{ width: 11, height: 11, borderRadius: 3, background: s.color, display: "inline-block" }} />{s.label}</span>
                <span className="pd-muted">{fmt(s.amt)} · {Math.round(s.frac * 100)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
