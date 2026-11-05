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

export function ReportHub({ onOpen }: { onOpen: (m: ReportMeta) => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const match = (m: ReportMeta) =>
    (!q.trim() || m.name.toLowerCase().includes(q.toLowerCase()) || m.desc.toLowerCase().includes(q.toLowerCase())) &&
    (!active || FILTER_PRED[active](m));
  const favourites = REPORT_CATALOG.filter((m) => m.fav && match(m));
  const groups: { cat: ReportCat; items: ReportMeta[] }[] = (["gst", "transaction", "item", "party"] as ReportCat[])
    .map((cat) => ({ cat, items: REPORT_CATALOG.filter((m) => m.cat === cat && !m.fav && match(m)) }));

  const Card = ({ m }: { m: ReportMeta }) => (
    <button className="pd-report-row" onClick={() => onOpen(m)}>
      <span className="nm">{m.name}</span>
      {m.fav && <span className="star"><IconStar size={13} /></span>}
    </button>
  );

  return (
    <div className="pd-canvas-wide">
      <div className="pd-toolbar">
        <div className="pd-flex pd-gap6" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <span className="pd-filter-label">Filter by</span>
          {FILTERS.map((f) => (
            <button key={f} className={`pd-chip${active === f ? " on" : ""}`} onClick={() => setActive((a) => (a === f ? null : f))}>{f}</button>
          ))}
        </div>
        <div className="pd-spacer" />
        <div className="pd-search-inline"><span className="ic"><IconSearch size={17} /></span><input placeholder="Find report…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>

      <div className="pd-report-grid">
        <div className="pd-report-col">
          <div className="pd-report-head">{CAT_ICON.favourite} Favourite</div>
          {favourites.map((m) => <Card key={m.id} m={m} />)}
          {favourites.length === 0 && <div className="pd-muted" style={{ padding: "8px 2px", fontSize: 12.5 }}>No matches</div>}
        </div>
        {groups.map((g) => (
          <div className="pd-report-col" key={g.cat}>
            <div className="pd-report-head">{CAT_ICON[g.cat]} {CAT_LABEL[g.cat]}</div>
            {g.items.map((m) => <Card key={m.id} m={m} />)}
            {g.items.length === 0 && <div className="pd-muted" style={{ padding: "8px 2px", fontSize: 12.5 }}>No matches</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
