import { useState, useMemo, useEffect, ReactNode } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  inr, inr2, computeInvoice, Sale, PAY_LABEL, PayMode, Channel, OrderStatus,
  STATUS_LABEL, channelLabel, catLabel, CATEGORIES, purchaseTotals,
  earliestBatch, stockOf, fmtDateTime,
} from "@/domain";
import { IconPrint, IconRupee, IconSearch, IconSparkle, IconReceipt, IconDoc, IconBox, IconUsers, IconDownload, IconChart, IconTrendUp, IconStar } from "@/components/Icon"
import { monogramOf } from "@/components/entityIcon";
import { usePeriod } from "@/components/PeriodFilter";
import {
  REPORT_CATALOG, CAT_LABEL, ReportCat, ReportMeta, runReport, ReportResult, reportById,
} from "@/features/reports/reportCatalog";
import { exportCatalogCsv, exportCatalogPdf } from "@/features/reports/reportExport";

;

type Tab = "overview" | "sales" | "products" | "accounts";

const CAT_ICON: Record<ReportCat, ReactNode> = { favourite: <IconSparkle size={15} />, gst: <IconReceipt size={15} />, transaction: <IconDoc size={15} />, item: <IconBox size={15} />, party: <IconUsers size={15} /> };

const FILTER_PRED: Record<string, (m: ReportMeta) => boolean> = {
  Party: (m) => m.cat === "party",
  Category: (m) => /categor/i.test(m.name) || m.cat === "item",
  "Payment Collection": (m) => ["cash-bank", "receivable-ageing", "party-outstanding", "party-ledger", "tcs-receivable", "tds-payable", "tds-receivable"].includes(m.id),
  Item: (m) => m.cat === "item",
  "Invoice Details": (m) => ["audit-trail", "bill-wise-profit", "gstr1", "gst-sales-hsn", "sales-summary", "purchase-summary"].includes(m.id),
  Summary: (m) => /summary/i.test(m.name) || m.fav === true,
};

const FILTERS = Object.keys(FILTER_PRED);

type SSort = "date" | "total" | "items" | "customer";

type PSort = "units" | "revenue" | "profit" | "margin" | "stock";

export function Accounts(p: any) {
  const { revenue, taxable, cogs, grossProfit, margin, discounts, outputGst, inputGst, netGst, purchaseTotal, payMap, receivables, enriched, winPurchases, profile, now } = p;

  // GST slab breakup (output)
  const slabMap = new Map<number, { taxable: number; tax: number }>();
  enriched.forEach((r: any) => r.t.lines.forEach((l: any) => {
    const cur = slabMap.get(l.gst) ?? { taxable: 0, tax: 0 };
    slabMap.set(l.gst, { taxable: cur.taxable + l.taxable, tax: cur.tax + l.cgst + l.sgst });
  }));
  const slabs = [...slabMap.entries()].sort((a, b) => a[0] - b[0]);

  // day book — net sales & purchases per day
  const dayMap = new Map<string, { sales: number; purch: number }>();
  enriched.forEach((r: any) => { const k = new Date(r.s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); const c = dayMap.get(k) ?? { sales: 0, purch: 0 }; c.sales += r.t.payable; dayMap.set(k, c); });
  winPurchases.forEach((pu: any) => { const k = new Date(pu.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); const c = dayMap.get(k) ?? { sales: 0, purch: 0 }; c.purch += purchaseTotals(pu.items).total; dayMap.set(k, c); });
  const days = [...dayMap.entries()];

  return (
    <>
      <div className="pd-grid-2b" style={{ marginBottom: 16 }}>
        {/* P&L */}
        <div className="pd-card">
          <div className="pd-card-head"><h3>Profit & Loss</h3><span className="sub">{profile.name}</span></div>
          <div className="pd-card-pad pd-pl">
            <div className="pd-pl-head">Income</div>
            <div className="r"><span className="lb">Gross sales (incl. GST)</span><span className="vl">{inr(revenue + discounts)}</span></div>
            <div className="r sub"><span className="lb">less: discounts given</span><span className="vl neg">− {inr(discounts)}</span></div>
            <div className="r sub"><span className="lb">less: output GST</span><span className="vl neg">− {inr(outputGst)}</span></div>
            <div className="r"><span className="lb">Net sales (taxable)</span><span className="vl">{inr(taxable)}</span></div>
            <div className="pd-pl-head">Cost of goods</div>
            <div className="r"><span className="lb">COGS (at purchase cost)</span><span className="vl neg">− {inr(cogs)}</span></div>
            <div className="r tot"><span className="lb">Gross profit</span><span className="vl pos">{inr(grossProfit)} <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>· {margin.toFixed(1)}%</span></span></div>
          </div>
        </div>

        {/* GST liability */}
        <div className="pd-card">
          <div className="pd-card-head"><h3>GST liability</h3><span className="sub">{profile.gstin}</span></div>
          <div className="pd-card-pad pd-pl">
            <div className="pd-pl-head">Output tax (on sales)</div>
            {slabs.length === 0 && <div className="r"><span className="lb pd-muted">No taxable sales</span><span className="vl">—</span></div>}
            {slabs.map(([gst, v]) => (
              <div className="r sub" key={gst}><span className="lb">GST {gst}% · CGST {gst / 2} + SGST {gst / 2}</span><span className="vl">{inr2(v.tax)}</span></div>
            ))}
            <div className="r"><span className="lb">Total output GST</span><span className="vl">{inr(outputGst)}</span></div>
            <div className="pd-pl-head">Input tax credit (on purchases)</div>
            <div className="r"><span className="lb">Input GST (GSTR-2)</span><span className="vl neg">− {inr(inputGst)}</span></div>
            <div className="r tot"><span className="lb">{netGst >= 0 ? "Net GST payable" : "Net GST credit (carried fwd)"}</span><span className={`vl ${netGst >= 0 ? "neg" : "pos"}`}>{inr(Math.abs(netGst))}</span></div>
          </div>
        </div>
      </div>

      <div className="pd-grid-2" style={{ marginBottom: 16 }}>
        {/* collections + receivables */}
        <div className="pd-card">
          <div className="pd-card-head"><h3>Cash & collections</h3></div>
          <div className="pd-card-pad">
            {(["cash", "upi", "card", "cod"] as PayMode[]).map((m) => {
              const v = payMap.get(m) ?? 0; const pct = revenue ? (v / revenue) * 100 : 0;
              return (
                <div className="pd-bd" key={m}>
                  <span className="nm">{PAY_LABEL[m]}</span>
                  <span className="track"><i style={{ width: `${pct}%` }} /></span>
                  <b style={{ minWidth: 80, textAlign: "right" }}>{inr(v)}</b>
                </div>
              );
            })}
            <div className="pd-flex" style={{ justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--line-2)" }}>
              <span className="pd-muted" style={{ fontSize: 13 }}>COD receivable (in transit)</span>
              <b style={{ fontFamily: "Manrope", fontSize: 16, color: "var(--amber)" }}>{inr(receivables)}</b>
            </div>
          </div>
        </div>

        {/* purchases summary */}
        <div className="pd-card">
          <div className="pd-card-head"><h3>Purchases (inward)</h3></div>
          <div className="pd-card-pad pd-pl">
            <div className="r"><span className="lb">Goods purchased (incl. GST)</span><span className="vl">{inr(purchaseTotal)}</span></div>
            <div className="r"><span className="lb">Input GST credit</span><span className="vl">{inr(inputGst)}</span></div>
            <div className="r"><span className="lb">GRNs entered</span><span className="vl">{winPurchases.length}</span></div>
            <div className="r tot"><span className="lb">Net stock investment</span><span className="vl">{inr(purchaseTotal - inputGst)}</span></div>
          </div>
        </div>
      </div>

      {/* day book */}
      <div className="pd-card">
        <div className="pd-card-head"><h3>Day book</h3><span className="sub">net sales vs purchases</span></div>
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead><tr><th>Day</th><th className="num">Net sales</th><th className="num">Purchases</th><th className="num">Net cash flow</th></tr></thead>
            <tbody>
              {days.length === 0 && <tr><td colSpan={4}><div className="pd-empty" style={{ padding: 20 }}><p>No activity in this period.</p></div></td></tr>}
              {days.map(([k, v]) => (
                <tr key={k}><td style={{ fontWeight: 600 }}>{k}</td><td className="num">{inr(v.sales)}</td><td className="num pd-muted">{v.purch ? inr(v.purch) : "—"}</td><td className="num" style={{ fontWeight: 700, color: v.sales - v.purch >= 0 ? "var(--green)" : "var(--rose)" }}>{inr(v.sales - v.purch)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
