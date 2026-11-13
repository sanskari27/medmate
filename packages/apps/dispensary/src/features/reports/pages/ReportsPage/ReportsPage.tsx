import { useState, type ChangeEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import {
  IconBox,
  IconDoc,
  IconReceipt,
  IconSearch,
  IconSparkle,
  IconStar,
  IconUsers,
} from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import {
  COLUMN_LABEL,
  REPORT_COLUMNS,
  REPORT_FILTERS,
  columnReports,
  matchingReports,
  type ReportCat,
  type ReportFilter,
  type ReportMeta,
} from "../../catalog";

const COLUMN_ICON: Record<ReportCat, ReactNode> = {
  favourite: <IconSparkle size={15} />,
  gst: <IconReceipt size={15} />,
  transaction: <IconDoc size={15} />,
  item: <IconBox size={15} />,
  party: <IconUsers size={15} />,
};

export function ReportsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReportFilter | null>(null);
  const shown = matchingReports(query, filter);

  function chooseFilter(next: ReportFilter) {
    setFilter((current) => (current === next ? null : next));
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-4 flex flex-wrap items-center gap-2.5">
        <Box className="flex flex-wrap items-center gap-1.5">
          <Text
            className="mr-0.5 text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase"
            as="span"
          >
            Filter by
          </Text>
          {REPORT_FILTERS.map((name) => (
            <Button
              key={name}
              type="button"
              variant="ghost"
              aria-pressed={filter === name}
              className={cn(
                "h-auto rounded-full px-3.5 py-[7px] text-[12.5px] max-[767px]:min-h-10",
                filter === name && "border-dark bg-dark text-white hover:bg-dark hover:text-white",
              )}
              onClick={() => chooseFilter(name)}
            >
              {name}
            </Button>
          ))}
        </Box>
        <Box className="flex-1" />
        <Box className="flex max-w-[360px] min-w-[240px] flex-1 items-center gap-2 rounded-sm border border-line-2 bg-paper px-3 py-2">
          <Text className="text-green" as="span">
            <IconSearch size={17} />
          </Text>
          <Input
            variant="plain"
            aria-label="Find report"
            placeholder="Find report…"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          />
        </Box>
      </Box>
      <Box className="grid grid-cols-3 gap-x-[38px] max-[1099px]:grid-cols-2 max-[767px]:grid-cols-1">
        {REPORT_COLUMNS.map((cat) => {
          const items = columnReports(shown, cat);
          return (
            <Box key={cat} className="border-t border-line pt-1.5">
              <Box className="flex items-center gap-[7px] px-0.5 pt-3 pb-2 font-display text-[13.5px] font-extrabold text-muted">
                {COLUMN_ICON[cat]} {COLUMN_LABEL[cat]}
              </Box>
              {items.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
              {items.length === 0 ? (
                <Text className="px-0.5 py-2 text-[12.5px] text-muted">No matches</Text>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function ReportCard({ report }: { report: ReportMeta }) {
  return (
    <Link
      to={`/reports/${report.id}`}
      className="flex h-auto w-full items-center justify-between rounded-[7px] px-0.5 py-[9px] text-left text-[14px] font-normal text-ink hover:bg-wash-2 hover:px-2 hover:text-green"
    >
      <span>{report.name}</span>
      {report.fav ? (
        <span className="text-[15px] text-gold">
          <IconStar size={13} />
        </span>
      ) : null}
    </Link>
  );
}
