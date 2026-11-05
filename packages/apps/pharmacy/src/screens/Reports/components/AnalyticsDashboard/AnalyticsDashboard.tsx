import { useState, useMemo } from "react";
import { usePharma } from "@/store/slices/session";
import { computeInvoice, PayMode, purchaseTotals, earliestBatch } from "@/utils";
import { IconPrint } from "@/components/Icon";
import { usePeriod } from "@/components/PeriodFilter";
import { Overview } from "@/screens/Reports/components/Overview";
import { SalesRegister } from "@/screens/Reports/components/SalesRegister";
import { ProductsReport } from "@/screens/Reports/components/ProductsReport";
import { Accounts } from "@/screens/Reports/components/Accounts";

type Tab = "overview" | "sales" | "products" | "accounts";

export function AnalyticsDashboard({
  initialTab,
  onBack,
}: {
  initialTab: Tab;
  onBack: () => void;
}) {
  const { sales, purchases, inventory, now, profile } = usePharma();
  const [tab, setTab] = useState<Tab>(initialTab);

  // ── shared date period (Day / Month / Year / FY / Custom / All) ──
  const period = usePeriod(now, "month");
  const inWindow = period.inWindow;
  const windowLabel = period.label;
  const winStart = period.start,
    winEnd = period.end;

  // ── cost lookup (approx: current PTR) for margin / COGS ──
  const costOf = (productId: string) => {
    const p = inventory.find((x) => x.id === productId);
    return p ? (earliestBatch(p)?.ptr ?? p.batches[0]?.ptr ?? 0) : 0;
  };

  // ── enriched sales in window (excl. cancelled) ──
  const enriched = useMemo(
    () =>
      sales
        .filter((s) => s.status !== "cancelled" && inWindow(s.createdAt))
        .map((s) => {
          const t = computeInvoice(s.items, s.discount);
          const cogs = s.items.reduce((a, i) => a + costOf(i.productId) * i.qty, 0);
          return { s, t, cogs };
        }),
    [sales, inventory, winStart, winEnd],
  );

  const winPurchases = useMemo(
    () => purchases.filter((p) => inWindow(p.createdAt)),
    [purchases, winStart, winEnd],
  );

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
    .filter(
      (s) =>
        s.channel === "online" &&
        s.payMode === "cod" &&
        !["delivered", "cancelled"].includes(s.status),
    )
    .reduce((a, s) => a + computeInvoice(s.items, s.discount).payable, 0);

  return (
    <div className="pd-canvas-wide pd-print-area">
      {/* ── filter bar ── */}
      <div className="pd-toolbar pd-no-print">
        <button className="pd-btn pd-btn-ghost" onClick={onBack}>
          ← All reports
        </button>
        <div className="pd-seg">
          {(["overview", "sales", "products", "accounts"] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {t === "overview"
                ? "Overview"
                : t === "sales"
                  ? "Sales register"
                  : t === "products"
                    ? "Products"
                    : "Accounts & GST"}
            </button>
          ))}
        </div>
        <div className="pd-spacer" />
        {period.node}
        <button className="pd-btn pd-btn-ghost" onClick={() => window.print()}>
          <IconPrint size={16} /> Export
        </button>
      </div>

      <div className="pd-flex pd-no-print" style={{ marginBottom: 16, gap: 8 }}>
        <span className="pd-pill pill-green">
          <i className="d" />
          Showing: {windowLabel}
        </span>
        <span className="pd-muted" style={{ fontSize: 12.5 }}>
          {enriched.length} sales · {winPurchases.length} purchases
        </span>
      </div>

      {tab === "overview" && (
        <Overview
          {...{
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
          }}
        />
      )}
      {tab === "sales" && <SalesRegister enriched={enriched} now={now} />}
      {tab === "products" && (
        <ProductsReport enriched={enriched} inventory={inventory} costOf={costOf} />
      )}
      {tab === "accounts" && (
        <Accounts
          {...{
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
          }}
        />
      )}
    </div>
  );
}
