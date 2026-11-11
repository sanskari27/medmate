import { Link } from "react-router-dom";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { formatWhen, mergeQueues, stageLabel } from "../../reviewModel";
import { problemMessage } from "../../problemMessage";
import { useListApplicationsQuery } from "../../services/reviews.api";
import type { ApplicationSummary } from "../../types";

function ApplicationRow({ row }: { row: ApplicationSummary }) {
  return (
    <Link
      to={`/reviews/${row.pharmacyId}`}
      aria-label={row.name}
      className="grid gap-2 rounded-lg border border-line bg-paper px-4 py-3.5 transition-colors hover:border-mid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
    >
      <span className="min-w-0">
        <Text className="truncate text-[15px] font-bold text-dark">{row.name}</Text>
        <Text variant="muted" className="mt-0.5">
          {row.phone}
        </Text>
      </span>
      <span className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Text
          as="span"
          className="rounded-full bg-wash px-2.5 py-1 text-[11px] font-bold tracking-wide text-dark uppercase"
        >
          {stageLabel(row.status)}
        </Text>
        {row.submittedAt ? (
          <time dateTime={row.submittedAt} className="text-[12.5px] text-muted">
            {formatWhen(row.submittedAt)}
          </time>
        ) : (
          <Text as="span" variant="muted">
            —
          </Text>
        )}
      </span>
    </Link>
  );
}

export function ReviewsPage() {
  const compliance = useListApplicationsQuery("pending_compliance");
  const admin = useListApplicationsQuery("pending_admin");
  const failure = compliance.error ?? admin.error;

  if (failure) {
    return (
      <Text className="text-[13.5px] font-bold text-rose">
        {problemMessage(failure, "Could not load applications")}
      </Text>
    );
  }
  if (compliance.isLoading || admin.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading applications</Text>;
  }

  const rows = mergeQueues(compliance.data ?? [], admin.data ?? []);
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No applications are waiting for review."
        body="Submitted pharmacies show up here while a decision is still open."
      />
    );
  }

  return (
    <Stack className="gap-3">
      {rows.map((row) => (
        <ApplicationRow key={row.pharmacyId} row={row} />
      ))}
    </Stack>
  );
}
