import { Link } from "react-router-dom";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { blockLabel, rowName, statusLabel } from "../../ownerModel";
import { problemMessage } from "../../problemMessage";
import { useListOwnersQuery } from "../../services/pharmacies.api";
import type { OwnerSummary } from "../../types";

function OwnerRow({ row }: { row: OwnerSummary }) {
  const name = rowName(row.name, row.phone);
  return (
    <Link
      to={`/pharmacies/${row.pharmacyId}`}
      aria-label={name}
      className="grid gap-2 rounded-lg border border-line bg-paper px-4 py-3.5 transition-colors hover:border-mid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
    >
      <span className="min-w-0">
        <Text className="truncate text-[15px] font-bold text-dark">
          {row.name?.trim() ? row.name : "—"}
        </Text>
        <Text variant="muted" className="mt-0.5">
          {row.phone}
        </Text>
      </span>
      <span className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Text
          as="span"
          className="rounded-full bg-wash px-2.5 py-1 text-[11px] font-bold tracking-wide text-dark uppercase"
        >
          {statusLabel(row.status)}
        </Text>
        <Text
          as="span"
          className="rounded-full bg-wash px-2.5 py-1 text-[11px] font-bold tracking-wide text-dark uppercase"
        >
          {blockLabel(row.blockState)}
        </Text>
      </span>
    </Link>
  );
}

export function PharmaciesPage() {
  const owners = useListOwnersQuery();

  if (owners.isError) {
    return (
      <Text className="text-[13.5px] font-bold text-rose">
        {problemMessage(owners.error, "Could not load pharmacy owners")}
      </Text>
    );
  }
  if (owners.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading pharmacies</Text>;
  }

  const rows = owners.data ?? [];
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No pharmacy owners yet."
        body="Pharmacy owner accounts show up here. Staff accounts do not."
      />
    );
  }

  return (
    <Stack className="gap-3">
      {rows.map((row) => (
        <OwnerRow key={row.pharmacyId} row={row} />
      ))}
    </Stack>
  );
}
