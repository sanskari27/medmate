import type { AnalyticsDashboardProps } from "./AnalyticsDashboard.types";
import { Box, Button, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import { useState, useMemo } from "react";
import { usePharma } from "@/hooks";
import { computeInvoice, PayMode, purchaseTotals, earliestBatch } from "@/utils";
import { IconPrint } from "@/components/atoms";
import { usePeriod } from "@/components/organisms";
import { Overview } from "@/screens/Reports/components/Overview";
import { SalesRegister } from "@/screens/Reports/components/SalesRegister";
import { ProductsReport } from "@/screens/Reports/components/ProductsReport";
import { Accounts } from "@/screens/Reports/components/Accounts";
type Tab = "overview" | "sales" | "products" | "accounts";
export function AnalyticsDashboard({ initialTab, onBack, }: AnalyticsDashboardProps) {
    const { sales, purchases, inventory, now, profile } = usePharma();
    const [tab, setTab] = useState<Tab>(initialTab);
    // ── shared date period (Day / Month / Year / FY / Custom / All) ──
    const period = usePeriod(now, "month");
    const inWindow = period.inWindow;
    const windowLabel = period.label;
    const winStart = period.start, winEnd = period.end;
    // ── cost lookup (approx: current PTR) for margin / COGS ──
    const costOf = (productId: string) => {
        const p = inventory.find((x) => x.id === productId);
        return p ? (earliestBatch(p)?.ptr ?? p.batches[0]?.ptr ?? 0) : 0;
    };
    // ── enriched sales in window (excl. cancelled) ──
    const enriched = useMemo(() => sales
        .filter((s) => s.status !== "cancelled" && inWindow(s.createdAt))
        .map((s) => {
        const t = computeInvoice(s.items, s.discount);
        const cogs = s.items.reduce((a, i) => a + costOf(i.productId) * i.qty, 0);
        return { s, t, cogs };
    }), [sales, inventory, winStart, winEnd]);
    const winPurchases = useMemo(() => purchases.filter((p) => inWindow(p.createdAt)), [purchases, winStart, winEnd]);
    // ── aggregates ──
    const revenue = enriched.reduce((a, r) => a + r.t.payable, 0);
    const taxable = enriched.reduce((a, r) => a + r.t.taxable, 0);
    const outputGst = enriched.reduce((a, r) => a + r.t.totalTax, 0);
    const discounts = enriched.reduce((a, r) => a + r.t.discount, 0);
    const cogs = enriched.reduce((a, r) => a + r.cogs, 0);
    const grossProfit = taxable - cogs;
    const margin = taxable > 0 ? (grossProfit / taxable) * 100 : 0;
    const units = enriched.reduce((a, r) => a + r.s.items.reduce((x, i) => x + i.qty, 0), 0);
    const avg = enriched.length ? revenue / enriched.length : 0;
    const purchaseTotal = winPurchases.reduce((a, p) => a + purchaseTotals(p.items).total, 0);
    const inputGst = winPurchases.reduce((a, p) => a + purchaseTotals(p.items).gst, 0);
    const netGst = outputGst - inputGst;
    const online = enriched.filter((r) => r.s.channel === "online");
    const offline = enriched.filter((r) => r.s.channel === "offline");
    const onlineRev = online.reduce((a, r) => a + r.t.payable, 0);
    const offlineRev = offline.reduce((a, r) => a + r.t.payable, 0);
    const onlinePct = revenue ? Math.round((onlineRev / revenue) * 100) : 0;
    const payMap = new Map<PayMode, number>();
    enriched.forEach((r) => payMap.set(r.s.payMode, (payMap.get(r.s.payMode) ?? 0) + r.t.payable));
    // receivables: online COD not yet delivered/cancelled
    const receivables = sales
        .filter((s) => s.channel === "online" &&
        s.payMode === "cod" &&
        !["delivered", "cancelled"].includes(s.status))
        .reduce((a, s) => a + computeInvoice(s.items, s.discount).payable, 0);
    return (<Box className="!mx-auto !max-w-[1680px] print-area">
      {/* ── filter bar ── */}
      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5 print:hidden">
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onBack}>
          ← All reports
        </Button>
        <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
          {(["overview", "sales", "products", "accounts"] as Tab[]).map(renderT)}
        </Box>
        <Box className="!flex-1"/>
        {period.node}
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={printOnClick}>
          <IconPrint size={16}/> Export
        </Button>
      </Box>

      <Box className={cn("!flex !items-center !gap-2.5 print:hidden", "!mb-4 !gap-2")}>
        <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid" as="span">
          <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          Showing: {windowLabel}
        </Text>
        <Text className={cn("!text-muted", "!text-[12.5px]")} as="span">
          {enriched.length} sales · {winPurchases.length} purchases
        </Text>
      </Box>

      {tab === "overview" && (<Overview {...{
            revenue,
            grossProfit,
            margin,
            taxable,
            outputGst,
            netGst,
            units,
            avg,
            enriched,
            onlineRev,
            offlineRev,
            onlinePct,
            payMap,
            online,
            offline,
        }}/>)}
      {tab === "sales" && <SalesRegister enriched={enriched} now={now}/>}
      {tab === "products" && (<ProductsReport enriched={enriched} inventory={inventory} costOf={costOf}/>)}
      {tab === "accounts" && (<Accounts {...{
            revenue,
            taxable,
            cogs,
            grossProfit,
            margin,
            discounts,
            outputGst,
            inputGst,
            netGst,
            purchaseTotal,
            payMap,
            receivables,
            enriched,
            winPurchases,
            profile,
            now,
        }}/>)}
    </Box>);
    function renderT(t: Tab) {
        return (<Button key={t} className={tab === t ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"} onClick={setTabOnClick}>
              {t === "overview"
                ? "Overview"
                : t === "sales"
                    ? "Sales register"
                    : t === "products"
                        ? "Products"
                        : "Accounts & GST"}
            </Button>);
        function setTabOnClick() {
            return setTab(t);
        }
    }
    function printOnClick() {
        return window.print();
    }
}
