import type { SalesAnalyticsProps } from "./SalesAnalytics.types";
import { Box, Button, Heading, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import { useMemo, useState } from "react";
import { usePharma } from "@/hooks";
import { inr, catLabel, Sale, PayMode, PAY_LABEL, SaleSource, saleSourceOf } from "@/utils";
import { IconDonut, IconBars, IconTrendUp } from "@/components/Icon";
import { saleTotal } from "@/screens/Dashboard/utils/saleTotal";
import { inrK } from "@/screens/Dashboard/utils/inrK";
import { TrendChart } from "@/components/organisms";
import { DonutChart, Swatch } from "@/components/organisms";
import { SegmentBar } from "@/components/molecules/BarChart";
import { HBar } from "@/screens/Dashboard/components/HBar";
type Range = "7D" | "30D" | "12M";
type Metric = "revenue" | "orders";
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86400000;
const SRC_COLOR: Record<SaleSource, string> = {
    opd: "var(--color-blue)",
    counter: "var(--color-gold)",
    ward: "var(--color-rose)",
    emergency: "var(--color-amber)",
    online: "var(--color-mid)",
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
    Icon: (p: {
        size?: number;
    }) => React.ReactNode;
}[] = [
    { k: "donut", label: "Donut", Icon: IconDonut },
    { k: "group", label: "Grouped bars", Icon: IconBars },
    { k: "line", label: "Line", Icon: IconTrendUp },
];
type Series = {
    key: SaleSource;
    label: string;
    color: string;
    rev: number[];
    ord: number[];
};
export function SalesAnalytics({ sales, inventory, now, onlineRev, offlineRev, isHospital, }: SalesAnalyticsProps) {
    const [range, setRange] = useState<Range>("7D");
    const [metric, setMetric] = useState<Metric>("revenue");
    const [chart, setChart] = useState<ChartType>("donut");
    const srcOrder = useMemo(() => (isHospital ? SRC_ORDER : (["online", "counter"] as SaleSource[])), [isHospital]);
    const [hidden, setHidden] = useState<Set<SaleSource>>(new Set());
    const windowStart = now - (range === "7D" ? 7 : range === "30D" ? 30 : 365) * DAY;
    const realSales = useMemo(() => sales.filter((s) => s.status !== "cancelled" && s.createdAt >= windowStart), [sales, windowStart]);
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
            for (let i = 6; i >= 0; i--)
                labels.push(WD[new Date(now - i * DAY).getDay()]);
        else if (range === "30D")
            for (let i = 4; i >= 0; i--)
                labels.push(i === 0 ? "This wk" : i + "w ago");
        else
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now);
                d.setMonth(d.getMonth() - i);
                labels.push(MO[d.getMonth()]);
            }
        const totalBase = range === "7D" ? 11500 : range === "30D" ? 76000 : 330000;
        const share = (k: SaleSource, i: number) => srcRealTotal > 0 ? srcRows[i].amt / srcRealTotal : 1 / srcOrder.length;
        const wave = (k: number) => 0.55 +
            0.45 * (((Math.sin(k * 0.9) + 1) / 2) * 0.6 + ((Math.sin(k * 0.5 + 1.3) + 1) / 2) * 0.4);
        const TICKET = range === "7D" ? 430 : range === "30D" ? 445 : 455;
        const series: Series[] = srcOrder.map((k, si) => {
            const base = totalBase * share(k, si);
            const rev = labels.map((_, i) => Math.round(base * wave(i + si * 1.7)));
            if (range === "7D") {
                // anchor the latest bucket to today's real figures where we have them
 if (k ==="online" && onlineRev > 0)
 rev[rev.length - 1] = onlineRev;
 if (k ==="counter" && offlineRev > 0)
 rev[rev.length - 1] = offlineRev;}
 const ord = rev.map((v) => Math.max(v > 0 ? 1 : 0, Math.round(v / TICKET)));
 return { key: k, label: SRC_LABEL[k], color: SRC_COLOR[k], rev, ord};});
 return { labels, series};}, [range, now, srcRows, srcRealTotal, srcOrder, onlineRev, offlineRev]);
 const visible = series.filter((s) => !hidden.has(s.key));
 const val = (s: Series, i: number) => (metric ==="revenue" ? s.rev[i] : s.ord[i]);
 const totals = labels.map((_, i) => visible.reduce((a, s) => a + val(s, i), 0));
 const sumTot = totals.reduce((a, b) => a + b, 0);
 const fmt = (n: number) => (metric ==="revenue" ? inr(n) :`${n}`);
 const fmtAxis = (n: number) => (metric ==="revenue" ? inrK(n) :`${Math.round(n)}`);
 // donut = composition over the window (per visible source), synthetic total to match the trend
 const donutRows = visible.map((s) => ({
 key: s.key,
 label: s.label,
 color: s.color,
 amt: s.rev.reduce((a, b) => a + b, 0),
 amtOrd: s.ord.reduce((a, b) => a + b, 0),}));
 // ── real breakdowns (payment + categories) ──
 const payRows = useMemo(() => {
 const m: Record<string, number> = {};
 realSales.forEach((s) => {
 m[s.payMode] = (m[s.payMode] || 0) + saleTotal(s);});
 const tot = Object.values(m).reduce((a, b) => a + b, 0) || 1;
 return (Object.keys(m) as PayMode[])
 .sort((a, b) => m[b] - m[a])
 .map((k) => ({ key: k, label: PAY_LABEL[k], amt: m[k], pct: (m[k] / tot) * 100}));}, [realSales]);
 const catRows = useMemo(() => {
 const m: Record<string, number> = {};
 realSales.forEach((s) => s.items.forEach((it) => {
 const cat = inventory.find((p) => p.id === it.productId)?.category ??"other";
 m[cat] = (m[cat] || 0) + it.price * it.qty;}));
 const max = Math.max(...Object.values(m), 1);
 return Object.keys(m)
 .sort((a, b) => m[b] - m[a])
 .slice(0, 5)
 .map((k) => ({ key: k, label: catLabel(k), amt: m[k], pct: (m[k] / max) * 100}));}, [realSales, inventory]);
 const srcRealShownTotal = srcRows.reduce((a, r) => a + r.amt, 0) || 1;
 const rangeLabel = range ==="7D" ?"last 7 days" : range ==="30D" ?"last 5 weeks" :"last 12 months";
 const toggle = (k: SaleSource) => setHidden((h) => {
 const n = new Set(h);
 if (n.has(k))
 n.delete(k);
 else
 n.add(k);
 if (n.size >= series.length)
 return h;
 return n;});
 return (<Box>
 <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
 <Box className={cn("!flex !flex-wrap !items-center !justify-between !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold","!flex-wrap")}>
 <Box>
 <Heading level={3}>
 Sales analytics{""}
 {isHospital && (<Text className={cn("!text-muted","!font-semibold !text-[12px]")} as="span">
 · all sources
 </Text>)}
 </Heading>
 <Text className={cn("!text-muted","!text-[12px]")} as="span">
 {metric ==="revenue" ? inr(sumTot) :`${sumTot} orders`} · {rangeLabel}
 </Text>
 </Box>
 <Box className={cn("!flex !items-center","!gap-2 !flex-wrap")}>
 <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
 {(["revenue","orders"] as Metric[]).map(renderM)}
 </Box>
 <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
 {(["7D","30D","12M"] as Range[]).map(renderR)}
 </Box>
 </Box>
 </Box>

 {/* chart-type picker */}
 <Box className={cn("!flex-1 !p-[18px]","!pb-0")}>
 <Box className={cn("!flex !items-center","!justify-between !flex-wrap")}>
 <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
 {CHART_OPTS.map(renderCHARTOPTS)}
 </Box>
 {/* clickable source legend (show / hide series) */}
 <Box className="!flex !flex-wrap !items-center !gap-1.5">
 {series.map(renderSery)}
 </Box>
 </Box>
 </Box>

 <Box className="!flex-1 !p-[18px]">
 {chart ==="donut" ? (<DonutChart rows={donutRows.map(matchDonutRow)} fmt={fmt}/>) : (<TrendChart labels={labels} series={visible} type={chart} valOf={val} fmtAxis={fmtAxis} fmt={fmt}/>)}
 </Box>
 </Box>

 {/* real breakdowns */}
 <Box className={cn("!grid !grid-cols-3 !gap-4 max-[767px]:!grid-cols-1","!mt-4")}>
 <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
 <Box className="!flex !flex-wrap !items-center !justify-between !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
 <Heading level={3}>{isHospital ?"Sales by source" :"Channel split"}</Heading>
 <Text className="text-[12.5px] text-muted" as="span">actual · {rangeLabel}</Text>
 </Box>
 <Box className="!flex-1 !p-[18px]">
 <SegmentBar className="mb-3.5 h-3.5 overflow-hidden rounded-sm bg-wash" segments={srcSegments()} />
 {srcRows.map(renderSrcRow2)}
 </Box>
 </Box>

 <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
 <Box className="!flex !flex-wrap !items-center !justify-between !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
 <Heading level={3}>Payment modes</Heading>
 <Text className="text-[12.5px] text-muted" as="span">actual · {rangeLabel}</Text>
 </Box>
 <Box className="!flex-1 !p-[18px]">
 {payRows.length === 0 ? (<Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink","!py-4.5 !px-2")}>
 <Text>No sales in this window.</Text>
 </Box>) : (payRows.map(renderPayRow))}
 </Box>
 </Box>

 <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
 <Box className="!flex !flex-wrap !items-center !justify-between !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
 <Heading level={3}>Top categories</Heading>
 <Text className="text-[12.5px] text-muted" as="span">actual · {rangeLabel}</Text>
 </Box>
 <Box className="!flex-1 !p-[18px]">
 {catRows.length === 0 ? (<Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink","!py-4.5 !px-2")}>
 <Text>No sales in this window.</Text>
 </Box>) : (catRows.map(renderCatRow))}
 </Box>
 </Box>
 </Box>
 </Box>);
 function renderM(m: Metric) {
 return (<Button key={m} onClick={setMetricOnClick} className={cn(metric === m ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold","!capitalize")}>
 {m}
 </Button>);
 function setMetricOnClick() {
 return setMetric(m);}}
 function renderR(r: Range) {
 return (<Button key={r} className={range === r ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"} onClick={setRangeOnClick}>
 {r}
 </Button>);
 function setRangeOnClick() {
 return setRange(r);}}
 function renderCHARTOPTS(c: {
 k: ChartType;
 label: string;
 Icon: (p: {
 size?: number;}) => React.ReactNode;}) {
 return (<Button key={c.k} className={chart === c.k ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"} onClick={setChartOnClick} title={c.label}>
 <Text className={cn("!mr-[5px] !inline-flex !align-[-2px]")} as="span">
 {c.Icon({ size: 13})}
 </Text>
 {c.label}
 </Button>);
 function setChartOnClick() {
 return setChart(c.k);}}
 function renderSery(s: Series) {
 return (<Button key={s.key} className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-wash-2 px-2.5 py-1 text-[11.5px] font-bold text-ink hover:border-line-2 ${hidden.has(s.key) ?" opacity-40 line-through" :""}`} onClick={toggleOnClick} title={hidden.has(s.key) ?"Show" :"Hide"}>
 <Swatch color={s.color} />
 {s.label}
 </Button>);
 function toggleOnClick() {
 return toggle(s.key);}}
 function matchDonutRow(r: {
 key: SaleSource;
 label: string;
 color: string;
 amt: number;
 amtOrd: number;}) {
 return ({ ...r, amt: metric ==="revenue" ? r.amt : r.amtOrd});}
 function srcSegments() {
 return srcRows.filter(function hasAmount(row: { amt: number }) {
 return row.amt > 0;
 }).map(function toSegment(row: { key: SaleSource; label: string; amt: number }) {
 return { key: row.key, value: row.amt, color: SRC_COLOR[row.key], label: `${row.label} · ${inr(row.amt)}` };
 });}
 function renderSrcRow2(r: {
 key: SaleSource;
 label: string;
 amt: number;}) {
 return (<HBar key={r.key} label={r.label} right={`${inr(r.amt)} · ${Math.round((r.amt / srcRealShownTotal) * 100)}%`} pct={(r.amt / srcRealShownTotal) * 100} color={SRC_COLOR[r.key as SaleSource]}/>);}
 function renderPayRow(r: {
 key: PayMode;
 label: string;
 amt: number;
 pct: number;}) {
 return (<HBar key={r.key} label={r.label} right={`${inr(r.amt)} · ${Math.round(r.pct)}%`} pct={r.pct} color="var(--green)"/>);}
 function renderCatRow(r: {
 key: string;
 label: string;
 amt: number;
 pct: number;}) {
 return (<HBar key={r.key} label={r.label} right={inr(r.amt)} pct={r.pct} color="var(--teal)"/>);}}