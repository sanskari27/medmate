import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { PageBar } from "@/components/ui/PageBar";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useListCatalogQuery } from "../../catalog.api";
import {
  emptyFilters,
  rowMeta,
  type CatalogFilters,
  type DrugSummary,
  type FmcgSummary,
} from "../../model";
import { problemMessage } from "../../problemMessage";
import { FilterDialog } from "./FilterDialog";

const textDelayMs = 300;

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none hover:border-[#b9d0c2] focus:border-mid focus:shadow-focus";

const advancedKeys = [
  "displayName",
  "prescription",
  "form",
  "medicineType",
  "fmcgType",
  "marketer",
] as const satisfies readonly (keyof CatalogFilters)[];

function advancedCount(filters: CatalogFilters) {
  return advancedKeys.filter((key) => filters[key] !== "").length;
}

function ProductCard({ kind, row }: { kind: "drug" | "fmcg"; row: DrugSummary | FmcgSummary }) {
  const name = row.productName || row.productId;
  const kindLabel = kind === "drug" ? "Drug" : "FMCG";
  return (
    <Link
      to={`/catalog/${kind === "drug" ? "drugs" : "fmcg"}/${encodeURIComponent(row.productId)}`}
      aria-label={name}
      className="group block h-full rounded-lg outline-none focus-visible:shadow-focus"
    >
      <article className="flex h-full min-h-[148px] flex-col gap-3 rounded-lg border border-line bg-paper p-4 shadow-sm transition-[border-color,box-shadow] duration-150 group-hover:border-mid group-hover:shadow-card">
        <header className="flex items-start justify-between gap-3">
          <Heading level={3} className="min-w-0 text-[16px]">
            <span className="line-clamp-2">{name}</span>
          </Heading>
          <span className="shrink-0 rounded-full bg-wash px-2 py-0.5 text-[11px] font-bold tracking-wide text-mid uppercase">
            {kindLabel}
          </span>
        </header>
        <Text variant="muted" className="line-clamp-2">
          {row.displayName || "No display name"}
        </Text>
        <footer className="mt-auto border-t border-line pt-3">
          <Text variant="caption" className="truncate">
            {rowMeta(row.productId, row.marketerName)}
          </Text>
        </footer>
      </article>
    </Link>
  );
}

function Section({
  title,
  empty,
  total,
  children,
}: {
  title: string;
  empty: string;
  total: number;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-wash-2 px-4 py-3">
        <Heading level={3}>{`${title} · ${total}`}</Heading>
      </header>
      {total === 0 ? (
        <Text className="px-4 py-10 text-center text-[13.5px] text-muted">{empty}</Text>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-3 p-3">
          {children}
        </div>
      )}
    </section>
  );
}

export function CatalogPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CatalogFilters>(emptyFilters);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const appliedQuery = useRef(filters.q);
  const list = useListCatalogQuery({ page, size: 25, ...filters });
  const activeFilters = advancedCount(filters);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (appliedQuery.current === query) return;
      appliedQuery.current = query;
      setFilters((current) => ({ ...current, q: query }));
      setPage(1);
    }, textDelayMs);
    return () => window.clearTimeout(timer);
  }, [query]);

  function choose<Key extends keyof CatalogFilters>(key: Key, value: CatalogFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function clearAdvanced() {
    setFilters((current) => ({
      ...current,
      displayName: "",
      prescription: "",
      form: "",
      medicineType: "",
      fmcgType: "",
      marketer: "",
    }));
    setPage(1);
  }

  const drugs = list.data?.drug.items ?? [];
  const fmcg = list.data?.fmcg.items ?? [];
  const drugTotal = list.data?.drug.total ?? 0;
  const fmcgTotal = list.data?.fmcg.total ?? 0;

  return (
    <Stack className="gap-4">
      <section className="rounded-xl border border-line bg-paper p-4 shadow-sm sm:p-5">
        <Stack direction="row" align="center" justify="between" wrap className="mb-4 gap-3">
          <Stack className="gap-0.5">
            <Heading level={3}>Find a product</Heading>
            <Text variant="muted">Search both catalogs, then open a card to edit it.</Text>
          </Stack>
          <Stack direction="row" wrap className="gap-2">
            <Button asChild>
              <Link to="/catalog/drugs/new">New drug</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/catalog/fmcg/new">New FMCG</Link>
            </Button>
          </Stack>
        </Stack>
        <search>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_auto] md:items-end">
            <Field label="Text" htmlFor="catalog-text">
              <Input
                id="catalog-text"
                value={query}
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Name, id, or marketer"
                onChange={(event) => setQuery(event.target.value)}
              />
            </Field>
            <Field label="Kind" htmlFor="catalog-kind">
              <select
                id="catalog-kind"
                data-slot="select"
                className={selectClass}
                value={filters.kind}
                onChange={(event) => choose("kind", event.target.value as CatalogFilters["kind"])}
              >
                <option value="">Both</option>
                <option value="drug">Drug</option>
                <option value="fmcg">FMCG</option>
              </select>
            </Field>
            <Button
              type="button"
              variant="line"
              className="w-full md:w-auto"
              onClick={() => setFiltersOpen(true)}
            >
              Filters
              {activeFilters > 0 ? (
                <span
                  aria-hidden
                  className="grid size-5 place-items-center rounded-full bg-mid text-[11px] text-white"
                >
                  {activeFilters}
                </span>
              ) : null}
            </Button>
          </div>
        </search>
      </section>
      {list.isError ? (
        <Text className="text-[13.5px] font-bold text-rose" role="alert">
          {problemMessage(list.error, "Could not load the catalog")}
        </Text>
      ) : null}
      {list.isLoading ? <Text className="text-[13.5px] text-muted">Loading catalog</Text> : null}
      {!list.isLoading && !list.isError ? (
        <Stack className="gap-4">
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <Section title="Drugs" empty="No drugs match." total={drugTotal}>
              {drugs.map((row) => (
                <ProductCard key={row.productId} kind="drug" row={row} />
              ))}
            </Section>
            <Section title="FMCG" empty="No FMCG products match." total={fmcgTotal}>
              {fmcg.map((row) => (
                <ProductCard key={row.productId} kind="fmcg" row={row} />
              ))}
            </Section>
          </div>
          {Math.max(drugTotal, fmcgTotal) > 0 ? (
            <div className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm [&_[data-slot=box]]:border-t-0">
              <PageBar
                page={list.data?.drug.page ?? page}
                size={list.data?.drug.size ?? 25}
                total={Math.max(drugTotal, fmcgTotal)}
                onPage={setPage}
              />
            </div>
          ) : null}
        </Stack>
      ) : null}
      {filtersOpen ? (
        <FilterDialog
          filters={filters}
          onChoose={choose}
          onClear={clearAdvanced}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}
    </Stack>
  );
}
