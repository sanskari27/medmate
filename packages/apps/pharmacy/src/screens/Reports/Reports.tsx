import type { ReportMeta } from "@/utils";
import { ReportHub } from "@/screens/Reports/components/ReportHub";
import { ReportDetail } from "@/screens/Reports/components/ReportDetail";
import { AnalyticsDashboard } from "@/screens/Reports/components/AnalyticsDashboard";
import { useState, useEffect } from "react";
import { setReportTarget } from "@/store/actions/feedback.actions";
import { useAppDispatch, useAppSelector, usePharmacyNav } from "@/hooks";
import { reportById } from "@/utils/calculations/reportCatalog";
type Tab = "overview" | "sales" | "products" | "accounts";
// ════════════════════════ REPORTS (hub → detail / analytics) ════════════════════════
export default function ReportsScreen() {
  const dispatch = useAppDispatch();
  const reportTarget = useAppSelector((state) => state.reports.reportTarget);
  const { registerBack } = usePharmacyNav();
  const initial = reportTarget && reportById(reportTarget);
  const [view, setView] = useState<
    | {
        kind: "hub";
      }
    | {
        kind: "detail";
        id: string;
      }
    | {
        kind: "analytics";
        tab: Tab;
      }
  >(
    initial
      ? initial.analytics
        ? { kind: "analytics", tab: initial.analytics }
        : { kind: "detail", id: initial.id }
      : { kind: "hub" },
  );
  useEffect(() => {
    if (reportTarget) dispatch(setReportTarget(null));
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
    return <AnalyticsDashboard initialTab={view.tab} onBack={setViewOnBack} />;
  if (view.kind === "detail") return <ReportDetail id={view.id} onBack={setViewOnBack2} />;
  return <ReportHub onOpen={setViewOnOpen} />;
  function setViewOnBack() {
    return setView({ kind: "hub" });
  }
  function setViewOnBack2() {
    return setView({ kind: "hub" });
  }
  function setViewOnOpen(m: ReportMeta) {
    return setView(
      m.analytics ? { kind: "analytics", tab: m.analytics } : { kind: "detail", id: m.id },
    );
  }
}
