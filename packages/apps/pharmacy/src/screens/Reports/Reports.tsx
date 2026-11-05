import { ReportHub } from "@/screens/Reports/components/ReportHub";
import { ReportDetail } from "@/screens/Reports/components/ReportDetail";
import { AnalyticsDashboard } from "@/screens/Reports/components/AnalyticsDashboard";
import { useState, useEffect } from "react";
import { usePharma } from "@/store/slices/session";
import { reportById } from "@/utils/calculations/reportCatalog";

type Tab = "overview" | "sales" | "products" | "accounts";

// ════════════════════════ REPORTS (hub → detail / analytics) ════════════════════════

export default function ReportsScreen() {
  const { reportTarget, setReportTarget, registerBack } = usePharma();
  const initial = reportTarget && reportById(reportTarget);
  const [view, setView] = useState<
    { kind: "hub" } | { kind: "detail"; id: string } | { kind: "analytics"; tab: Tab }
  >(
    initial
      ? initial.analytics
        ? { kind: "analytics", tab: initial.analytics }
        : { kind: "detail", id: initial.id }
      : { kind: "hub" },
  );
  useEffect(() => {
    if (reportTarget) setReportTarget(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // let the global Back button close a report sub-view before it pops the route
  useEffect(() => {
    registerBack(
      view.kind === "hub"
        ? null
        : () => {
            setView({ kind: "hub" });
            return true;
          },
    );
    return () => registerBack(null);
  }, [view.kind, registerBack]);
  if (view.kind === "analytics")
    return <AnalyticsDashboard initialTab={view.tab} onBack={() => setView({ kind: "hub" })} />;
  if (view.kind === "detail")
    return <ReportDetail id={view.id} onBack={() => setView({ kind: "hub" })} />;
  return (
    <ReportHub
      onOpen={(m) =>
        setView(
          m.analytics ? { kind: "analytics", tab: m.analytics } : { kind: "detail", id: m.id },
        )
      }
    />
  );
}

// ════════════════════ ACCOUNTS & GST ════════════════════
