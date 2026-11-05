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

export const inrK = (n: number) => n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${Math.round(n)}`;
