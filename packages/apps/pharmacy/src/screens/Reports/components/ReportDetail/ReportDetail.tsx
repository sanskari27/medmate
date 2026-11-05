import { useMemo } from "react";
import { usePharma } from "@/hooks";
import { inr } from "@/utils";
import { IconPrint, IconDownload, IconChart } from "@/components/Icon";
import { usePeriod } from "@/components/PeriodFilter";
import { runReport, ReportResult, reportById } from "@/utils/calculations/reportCatalog";
import { exportCatalogCsv, exportCatalogPdf } from "@/utils/calculations/reportExport";

export function ReportDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { sales, purchases, inventory, expenses, now, profile } = usePharma();
  const meta = reportById(id);
  const period = usePeriod(now, "month");
  const res: ReportResult = useMemo(
    () =>
      runReport(id, {
        sales,
        purchases,
        inventory,
        expenses,
        profile,
        now,
        range: { from: period.start, to: period.end, label: period.label },
      }),
    [
      id,
      sales,
      purchases,
      inventory,
      expenses,
      profile,
      now,
      period.start,
      period.end,
      period.label,
    ],
  );
  const range = { from: period.start, to: period.end, label: period.label };
  const fmt = (v: string | number | undefined, money?: boolean) =>
    typeof v === "number" ? (money ? inr(v) : v.toLocaleString("en-IN")) : (v ?? "");

  return (
    <div className="pd-canvas-wide pd-print-area">
      <div className="pd-toolbar pd-no-print">
        <button className="pd-btn pd-btn-ghost" onClick={onBack}>
          ← All reports
        </button>
        <div className="pd-spacer" />
        {period.node}
        <button
          className="pd-btn pd-btn-ghost"
          disabled={!res.rows.length}
          onClick={() => exportCatalogCsv(meta?.name ?? id, res, range, now)}
        >
          <IconDownload size={14} /> Excel
        </button>
        <button
          className="pd-btn pd-btn-ghost"
          disabled={!res.rows.length}
          onClick={() => exportCatalogPdf(meta?.name ?? id, res, profile, range, now)}
        >
          <IconPrint size={16} /> PDF
        </button>
      </div>

      <div className="pd-flex" style={{ alignItems: "baseline", gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 20 }}>{meta?.name ?? id}</h2>
        <span className="pd-pill pill-green">
          <i className="d" />
          {period.label}
        </span>
      </div>
      {meta?.desc && (
        <p className="pd-muted" style={{ fontSize: 13, marginBottom: 14 }}>
          {meta.desc} · {res.rows.length} rows
        </p>
      )}

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                {res.columns.map((c) => (
                  <th key={c.key} className={c.money || c.num ? "num" : ""}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {res.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cellv, ci) => {
                    const c = res.columns[ci];
                    const isSection = typeof cellv === "string" && row[ci + 1] === "" && ci === 0;
                    return (
                      <td
                        key={ci}
                        className={c.money || c.num ? "num" : ""}
                        style={isSection ? { fontWeight: 800, color: "var(--dark)" } : undefined}
                      >
                        {fmt(cellv, c.money)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {res.rows.length === 0 && (
                <tr>
                  <td colSpan={res.columns.length}>
                    <div className="pd-empty">
                      <div className="em">
                        <IconChart size={30} />
                      </div>
                      <p>{res.note ?? "No data for this period."}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {res.totals && res.rows.length > 0 && (
              <tfoot>
                <tr>
                  {res.totals.map((t, ti) => (
                    <td
                      key={ti}
                      className={res.columns[ti]?.money || res.columns[ti]?.num ? "num" : ""}
                    >
                      {fmt(t, res.columns[ti]?.money)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      {res.note && res.rows.length > 0 && (
        <p className="pd-muted" style={{ fontSize: 12, marginTop: 10 }}>
          ⓘ {res.note}
        </p>
      )}
    </div>
  );
}
