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

export function Overview(p: any) {
  const { revenue, grossProfit, margin, outputGst, netGst, units, avg, enriched, onlineRev, offlineRev, onlinePct, payMap, online, offline } = p;
  // top items by GST-exclusive value
  const catRev = new Map<string, number>();
  enriched.forEach((r: any) => r.s.items.forEach((i: any) => {
    const ex = (i.price * i.qty) / (1 + i.gst / 100);
    // category isn't on SaleItem; group by GST slab band as a proxy label
    catRev.set(i.name, (catRev.get(i.name) ?? 0) + ex);
  }));
  const topItems = [...catRev.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topMax = Math.max(1, ...topItems.map((x) => x[1]));

  return (
    <>
      <div className="pd-stats">
        <div className="pd-stat"><div className="ic ic-green"><IconRupee size={19} /></div><div className="lbl">Net revenue</div><div className="val">{inr(revenue)}</div><div className="split">{enriched.length} sales · avg {inr(avg)}</div></div>
        <div className="pd-stat"><div className="ic ic-blue"><IconTrendUp size={18} /></div><div className="lbl">Gross profit</div><div className="val">{inr(grossProfit)}</div><div className="split">{margin.toFixed(1)}% margin</div></div>
        <div className="pd-stat"><div className="ic ic-gold"><IconBox size={18} /></div><div className="lbl">Units sold</div><div className="val">{units}</div><div className="split">across {enriched.length} bills</div></div>
        <div className="pd-stat"><div className="ic ic-rose"><IconReceipt size={18} /></div><div className="lbl">{netGst >= 0 ? "Net GST payable" : "Net GST credit (c/f)"}</div><div className="val">{inr(Math.abs(netGst))}</div><div className="split">output {inr(outputGst)}</div></div>
      </div>

      <div className="pd-grid-2">
        <div className="pd-card">
          <div className="pd-card-head"><h3>Top items by value</h3><span className="sub">GST-exclusive</span></div>
          <div className="pd-card-pad">
            {topItems.length === 0 ? <div className="pd-empty" style={{ padding: 20 }}><p>No sales in this period.</p></div> :
              topItems.map(([name, val]) => (
                <div key={name} style={{ marginBottom: 12 }}>
                  <div className="pd-flex" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ fontWeight: 700 }}>{name}</span><b>{inr(val)}</b></div>
                  <div className="pd-prog"><i style={{ width: `${(val / topMax) * 100}%` }} /></div>
                </div>
              ))}
          </div>
        </div>

        <div className="pd-card">
          <div className="pd-card-head"><h3>Channel & payment mix</h3></div>
          <div className="pd-card-pad">
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>Online vs Counter</div>
            <div style={{ display: "flex", height: 16, borderRadius: 8, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ width: `${onlinePct}%`, background: "var(--mid)" }} />
              <div style={{ width: `${100 - onlinePct}%`, background: "var(--gold)" }} />
            </div>
            <div className="pd-flex" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 18 }}>
              <span><b style={{ color: "var(--mid)" }}>● Online</b> {inr(onlineRev)} · {online.length}</span>
              <span><b style={{ color: "var(--gold-d)" }}>● Counter</b> {inr(offlineRev)} · {offline.length}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 10 }}>By payment method</div>
            {(["cash", "upi", "card", "cod"] as PayMode[]).map((m) => {
              const v = payMap.get(m) ?? 0; const pct = revenue ? (v / revenue) * 100 : 0;
              return (
                <div key={m} style={{ marginBottom: 9 }}>
                  <div className="pd-flex" style={{ justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}><span>{PAY_LABEL[m]}</span><b>{inr(v)}</b></div>
                  <div className="pd-prog"><i style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
