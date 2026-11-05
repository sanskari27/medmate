import { ReportHub } from "./ReportHub";
import { ReportDetail } from "./ReportDetail";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { useState, useMemo, useEffect, ReactNode } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  inr, inr2, computeInvoice, Sale, PAY_LABEL, PayMode, Channel, OrderStatus,
  STATUS_LABEL, channelLabel, catLabel, CATEGORIES, purchaseTotals,
  earliestBatch, stockOf, fmtDateTime,
} from "@/domain";
import { IconPrint, IconRupee, IconSearch, IconSparkle, IconReceipt, IconDoc, IconBox, IconUsers, IconDownload, IconChart, IconTrendUp, IconStar } from "@/components/Icon"
import { monogramOf } from "@/components/entityIcon";;
import { usePeriod } from "@/components/PeriodFilter";
import {
  REPORT_CATALOG, CAT_LABEL, ReportCat, ReportMeta, runReport, ReportResult, reportById,
} from "@/features/reports/reportCatalog";
import { exportCatalogCsv, exportCatalogPdf } from "@/features/reports/reportExport";

type Tab = "overview" | "sales" | "products" | "accounts";

// ════════════════════════ REPORTS (hub → detail / analytics) ════════════════════════
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

export default function ReportsScreen() {
  const { reportTarget, setReportTarget, registerBack } = usePharma();
  const initial = reportTarget && reportById(reportTarget);
  const [view, setView] = useState<{ kind: "hub" } | { kind: "detail"; id: string } | { kind: "analytics"; tab: Tab }>(
    initial ? (initial.analytics ? { kind: "analytics", tab: initial.analytics } : { kind: "detail", id: initial.id }) : { kind: "hub" }
  );
  useEffect(() => { if (reportTarget) setReportTarget(null); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // let the global Back button close a report sub-view before it pops the route
  useEffect(() => {
    registerBack(view.kind === "hub" ? null : () => { setView({ kind: "hub" }); return true; });
    return () => registerBack(null);
  }, [view.kind, registerBack]);
  if (view.kind === "analytics") return <AnalyticsDashboard initialTab={view.tab} onBack={() => setView({ kind: "hub" })} />;
  if (view.kind === "detail") return <ReportDetail id={view.id} onBack={() => setView({ kind: "hub" })} />;
  return <ReportHub onOpen={(m) => setView(m.analytics ? { kind: "analytics", tab: m.analytics } : { kind: "detail", id: m.id })} />;
}

// ════════════════════ OVERVIEW ════════════════════

// ════════════════════ SALES REGISTER ════════════════════
type SSort = "date" | "total" | "items" | "customer";

// ════════════════════ PRODUCTS ════════════════════
type PSort = "units" | "revenue" | "profit" | "margin" | "stock";

// ════════════════════ ACCOUNTS & GST ════════════════════

