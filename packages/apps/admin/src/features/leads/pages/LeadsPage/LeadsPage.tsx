import { useState } from "react";
import { Link } from "react-router-dom";
import { PageBar } from "@/components/ui/PageBar";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useListLeadsQuery } from "../../leads.api";
import {
  contactLine,
  emptyFilters,
  formatWhen,
  statusLabel,
  type LeadFilters,
  type LeadSummary,
} from "../../model";
import { problemMessage } from "../../problemMessage";

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none hover:border-[#b9d0c2] focus:border-mid focus:shadow-focus";

function LeadRow({ row }: { row: LeadSummary }) {
  return (
    <Link
      to={`/leads/${row.id}`}
      aria-label={row.name}
      className="grid gap-2 rounded-lg border border-line bg-paper px-4 py-3.5 transition-colors hover:border-mid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
    >
      <span className="min-w-0">
        <Text className="truncate text-[15px] font-bold text-dark">{row.name}</Text>
        <Text variant="muted" className="mt-0.5">
          {contactLine(row)}
        </Text>
      </span>
      <span className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Text
          as="span"
          className="rounded-full bg-wash px-2.5 py-1 text-[11px] font-bold tracking-wide text-dark uppercase"
        >
          {statusLabel(row.status)}
        </Text>
        <time dateTime={row.createdAt} className="text-[12.5px] text-muted">
          {formatWhen(row.createdAt)}
        </time>
      </span>
    </Link>
  );
}

export function LeadsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LeadFilters>(emptyFilters);
  const list = useListLeadsQuery({ page, size: 25, ...filters });

  function choose<Key extends keyof LeadFilters>(key: Key, value: LeadFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  const rows = list.data?.leads ?? [];
  const total = list.data?.total ?? 0;

  return (
    <Stack className="gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5 text-[13px] font-bold text-dark">
          Status
          <select
            className={selectClass}
            value={filters.status}
            onChange={(event) => choose("status", event.target.value as LeadFilters["status"])}
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-[13px] font-bold text-dark">
          Site
          <select
            className={selectClass}
            value={filters.site}
            onChange={(event) => choose("site", event.target.value as LeadFilters["site"])}
          >
            <option value="">All</option>
            <option value="nammamedmate">Namma MedMate</option>
            <option value="medmatepharmacy">MedMate Pharmacy</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-[13px] font-bold text-dark">
          Form
          <select
            className={selectClass}
            value={filters.type}
            onChange={(event) => choose("type", event.target.value as LeadFilters["type"])}
          >
            <option value="">All</option>
            <option value="contact">Contact</option>
            <option value="demo">Demo</option>
            <option value="early-access">Early access</option>
            <option value="pharmacy-partner">Pharmacy partner</option>
          </select>
        </label>
      </div>
      {list.isError ? (
        <Text className="text-[13.5px] font-bold text-rose">
          {problemMessage(list.error, "Could not load leads")}
        </Text>
      ) : null}
      {list.isLoading ? <Text className="text-[13.5px] text-muted">Loading leads</Text> : null}
      {!list.isLoading && !list.isError && total === 0 ? (
        <Text className="text-[13.5px] text-muted">No leads yet.</Text>
      ) : null}
      {!list.isLoading && !list.isError && total > 0 ? (
        <Stack className="gap-3">
          {rows.map((row) => (
            <LeadRow key={row.id} row={row} />
          ))}
          <PageBar
            page={list.data?.page ?? page}
            size={list.data?.size ?? 25}
            total={total}
            onPage={setPage}
          />
        </Stack>
      ) : null}
    </Stack>
  );
}
