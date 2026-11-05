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

export function Spark({ data, color = "var(--mid)" }: { data: number[]; color?: string }) {
  const w = 132, h = 30, max = Math.max(...data, 1), min = Math.min(...data, 0), rng = max - min || 1;
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * w, h - 2 - ((v - min) / rng) * (h - 5)] as const);
  const line = `M ${pts.map((p) => p.join(",")).join(" L ")}`;
  const area = `${line} L ${w},${h} L 0,${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg className="pd-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <path d={area} fill={color} opacity="0.12" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {last && <circle cx={last[0]} cy={last[1]} r="2.6" fill={color} />}
    </svg>
  );
}
