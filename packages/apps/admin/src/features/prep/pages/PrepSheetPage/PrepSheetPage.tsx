import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import type { CatalogHit, LineBody, PrepLine } from "../../model";
import { fileName, hitsOf } from "../../model";
import { problemMessage } from "../../problemMessage";
import {
  useExportPrepMutation,
  useReadPrepQuery,
  useRenamePrepMutation,
  useSaveLinesMutation,
  useSearchCatalogQuery,
} from "../../prep.api";

type DraftLine = {
  key: string;
  productId: string;
  productName: string;
  batchNo: string;
  expiry: string;
  qty: string;
  free: string;
  rate: string;
  mrp: string;
  gst: string;
};

type Baseline = { name: string; lines: LineBody[] };

const sheetField =
  "h-8 w-full min-w-0 rounded-xs border-transparent bg-transparent px-2 text-[13px] shadow-none hover:border-line-2 hover:bg-paper focus:border-mid focus:bg-paper focus:shadow-focus";

const selectClass = cn(sheetField, "cursor-pointer pr-8 text-left");

export function PrepSheetPage() {
  const { listId = "" } = useParams();
  const sheet = useReadPrepQuery(listId, { skip: !listId });
  const [renamePrep] = useRenamePrepMutation();
  const [saveLines, saveState] = useSaveLinesMutation();
  const [exportPrep, exportState] = useExportPrepMutation();
  const [name, setName] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [baseline, setBaseline] = useState<Baseline>({ name: "", lines: [] });
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const loaded = useRef<string | null>(null);
  const keys = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const skipLeave = useRef(false);
  const pending = useRef<HTMLElement | null>(null);
  const search = useSearchCatalogQuery(debounced, { skip: debounced.length < 2 });
  const hits = hitsOf(search.data);
  const current = { name: name.trim(), lines: bodyOf(lines) };
  const dirty = JSON.stringify(current) !== JSON.stringify(baseline);
  const open = debounced.length >= 2;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setHighlight(0);
  }, [debounced, hits.length]);

  useEffect(() => {
    if (!open) return;
    const option = document.getElementById(`prep-hit-${highlight}`);
    if (typeof option?.scrollIntoView === "function") {
      option.scrollIntoView({ block: "nearest" });
    }
  }, [highlight, open]);

  useEffect(() => {
    const detail = sheet.data?.list;
    if (!detail || loaded.current === detail.id) return;
    loaded.current = detail.id;
    const next = detail.lines.map(fromServer);
    setName(detail.name);
    setLines(next);
    setBaseline({ name: detail.name, lines: bodyOf(next) });
  }, [sheet.data]);

  useEffect(() => {
    if (!dirty) return;
    function onLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    function onClick(event: MouseEvent) {
      if (skipLeave.current) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("[data-slot=app-sidebar] button, [data-prep-leave]");
      if (!(control instanceof HTMLElement) || control.closest("[data-slot=modal-overlay]")) return;
      event.preventDefault();
      event.stopPropagation();
      pending.current = control;
      setLeaveOpen(true);
    }
    window.addEventListener("beforeunload", onLeave);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  function nextKey() {
    keys.current += 1;
    return `row-${keys.current}`;
  }

  function add(hit: CatalogHit) {
    if (lines.some((line) => line.productId === hit.productId && line.batchNo.trim() === "")) {
      setError("This product and batch is already on the list");
      setNotice(null);
      return;
    }
    setLines((rows) => [
      ...rows,
      {
        key: nextKey(),
        productId: hit.productId,
        productName: hit.productName,
        batchNo: "",
        expiry: "",
        qty: "",
        free: "",
        rate: "",
        mrp: hit.mrp == null ? "" : String(hit.mrp),
        gst: "",
      },
    ]);
    setQuery("");
    setDebounced("");
    setError(null);
    setNotice(null);
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (!open || hits.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => (index + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => (index - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[highlight] ?? hits[0];
      if (hit) add(hit);
    } else if (event.key === "Escape") {
      setQuery("");
      setDebounced("");
    }
  }

  function update(key: string, field: keyof DraftLine, value: string) {
    setLines((rows) => rows.map((line) => (line.key === key ? { ...line, [field]: value } : line)));
    setError(null);
    setNotice(null);
  }

  async function persist() {
    const problem = validate(lines);
    if (problem) {
      setError(problem);
      setNotice(null);
      focusRow(problem);
      return false;
    }
    try {
      let savedName = name.trim();
      if (savedName !== baseline.name) {
        const renamed = await renamePrep({ id: listId, name: savedName }).unwrap();
        savedName = renamed.list.name;
      }
      const saved = await saveLines({ id: listId, lines: bodyOf(lines) }).unwrap();
      const next = saved.list.lines.map(fromServer);
      setName(savedName);
      setLines(next);
      setBaseline({ name: savedName, lines: bodyOf(next) });
      setError(null);
      setNotice("Saved.");
      return true;
    } catch (caught) {
      const detail = problemMessage(caught, "Could not save the list.");
      setError(detail);
      setNotice(null);
      focusRow(detail);
      return false;
    }
  }

  async function exportCsv() {
    const problem = exportProblem(lines);
    if (problem) {
      setError(problem);
      setNotice(null);
      focusRow(problem);
      return;
    }
    if (dirty) {
      const ok = await persist();
      if (!ok) return;
    }
    try {
      const csv = await exportPrep(listId).unwrap();
      download(fileName(name.trim()), csv);
      setError(null);
      setNotice("Exported.");
    } catch (caught) {
      const detail = problemMessage(caught, "Could not export the list.");
      setError(detail);
      setNotice(null);
      focusRow(detail);
    }
  }

  function leave() {
    const control = pending.current;
    setLeaveOpen(false);
    skipLeave.current = true;
    control?.click();
    skipLeave.current = false;
    pending.current = null;
  }

  function searchSubmit(event: FormEvent) {
    event.preventDefault();
    const hit = hits[highlight] ?? hits[0];
    if (hit) add(hit);
  }

  const fault = faultRow(error);
  const updated = dirty || notice ? null : updatedLabel(sheet.data?.list.updatedAt);
  const loading = sheet.isLoading && lines.length === 0;

  if (sheet.isError) {
    return (
      <div className="rounded-xl border border-[#dc26262e] bg-rose-bg px-4 py-3">
        <Text role="alert" className="text-[13px] font-bold text-rose">
          {problemMessage(sheet.error, "Could not load the list.")}
        </Text>
      </div>
    );
  }

  return (
    <Stack className="gap-3">
      <div className="sticky top-0 z-20">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper px-2 py-2 shadow-sm">
          <Button asChild variant="ghost" size="sm">
            <Link to="/inventory-prep" data-prep-leave>
              <IconBack />
              Lists
            </Link>
          </Button>
          <span className="hidden h-5 w-px bg-line sm:block" aria-hidden />
          <label htmlFor="prep-list-name" className="sr-only">
            List name
          </label>
          <Input
            id="prep-list-name"
            value={name}
            maxLength={80}
            placeholder="List name"
            className="min-w-[12rem] flex-1 border-transparent bg-transparent px-2 py-1 font-display text-[17px] font-extrabold tracking-[-0.02em] text-dark shadow-none hover:border-line hover:bg-wash-2 focus:border-mid focus:bg-paper"
            onChange={(event) => {
              setName(event.target.value);
              setNotice(null);
            }}
          />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <SheetStatus dirty={dirty} notice={notice} updated={updated} />
            <Button type="button" disabled={saveState.isLoading} onClick={() => void persist()}>
              {saveState.isLoading ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={exportState.isLoading || saveState.isLoading}
              onClick={() => void exportCsv()}
            >
              {exportState.isLoading ? "Exporting…" : "Export CSV"}
            </Button>
          </div>
        </div>
      </div>
      {error ? (
        <Text
          role="alert"
          className="rounded-lg border border-[#dc26262e] bg-rose-bg px-3 py-2 text-[13px] font-bold text-rose"
        >
          {error}
        </Text>
      ) : null}
      <search className="rounded-xl border border-line bg-paper p-3 shadow-sm">
        <form aria-label="Add a product" onSubmit={searchSubmit}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor="prep-search" className="text-[13px] font-bold">
              Add a product
            </label>
            <span className="text-[12px] text-muted">Name, id, or marketer</span>
          </div>
          <div className="relative">
            <Input
              ref={searchRef}
              id="prep-search"
              type="search"
              role="combobox"
              aria-expanded={open}
              aria-controls="prep-search-list"
              aria-autocomplete="list"
              aria-activedescendant={open && hits[highlight] ? `prep-hit-${highlight}` : undefined}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="search"
              placeholder="Search the catalog"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKey}
            />
            {open ? (
              <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-line bg-paper shadow-pop">
                {search.isFetching ? (
                  <p
                    className="border-b border-line bg-wash-2 px-3 py-1.5 text-[12px] text-muted"
                    role="status"
                  >
                    Searching…
                  </p>
                ) : null}
                <ul
                  id="prep-search-list"
                  role="listbox"
                  aria-label="Catalog matches"
                  className="max-h-72 overflow-y-auto overscroll-contain"
                >
                  {!search.isFetching && hits.length === 0 ? (
                    <li className="px-3 py-6 text-center text-[13px] text-muted">
                      No products match.
                    </li>
                  ) : null}
                  {hits.map((hit, index) => (
                    <li key={`${hit.kind}-${hit.productId}`} role="presentation">
                      <button
                        type="button"
                        id={`prep-hit-${index}`}
                        role="option"
                        aria-selected={index === highlight}
                        className={cn(
                          "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-left hover:bg-wash-2",
                          index === highlight && "bg-wash shadow-[inset_3px_0_0_#2f7d52]",
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setHighlight(index)}
                        onClick={() => add(hit)}
                      >
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                            hit.kind === "drug"
                              ? "bg-paper text-mid ring-1 ring-line"
                              : "bg-teal-bg text-teal",
                          )}
                        >
                          {hit.kind === "drug" ? "Drug" : "FMCG"}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-bold">
                            {hit.productName}
                          </span>
                          <span className="block truncate text-[12px] text-muted">
                            {hit.productId}
                            {hit.marketerName ? ` · ${hit.marketerName}` : ""}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="block text-[10px] font-bold tracking-wide text-faint uppercase">
                            MRP
                          </span>
                          <span className="block text-[13px] tabular-nums">
                            {hit.mrp == null ? "—" : hit.mrp}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          {query.trim().length === 1 ? (
            <p className="mt-1.5 text-[12px] text-muted">Type one more character to search.</p>
          ) : null}
        </form>
      </search>
      <section className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <Heading level={3} id="prep-lines-caption" className="text-[15px]">
            Lines
          </Heading>
          <Text variant="muted" className="tabular-nums">
            {loading ? "Loading…" : `${lines.length} ${lines.length === 1 ? "row" : "rows"}`}
          </Text>
        </header>
        {loading ? (
          <div aria-busy="true" className="space-y-2 px-4 py-4">
            <span className="sr-only">Loading the list.</span>
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-9 animate-pulse rounded-sm bg-wash" />
            ))}
          </div>
        ) : lines.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-display text-[16px] font-extrabold tracking-[-0.02em] text-dark">
              No lines yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
              Search the catalog above. Each product becomes a row you can fill in before export.
            </p>
          </div>
        ) : (
          <div
            role="region"
            aria-labelledby="prep-lines-caption"
            tabIndex={0}
            className="max-h-[min(36rem,70dvh)] overflow-auto"
          >
            <table className="w-full min-w-[880px] table-fixed border-separate border-spacing-0 text-left">
              <caption className="sr-only">Inventory lines</caption>
              <colgroup>
                <col className="w-9" />
                <col />
                <col className="w-[8.5rem]" />
                <col className="w-[10.25rem]" />
                <col className="w-[4.75rem]" />
                <col className="w-[4.75rem]" />
                <col className="w-[5.5rem]" />
                <col className="w-[5.5rem]" />
                <col className="w-[5.25rem]" />
                <col className="w-12" />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-20 border-b border-line bg-wash-2 px-1 py-2 text-center text-[11px] font-bold text-muted"
                  >
                    <span className="sr-only">Row</span>
                    <span aria-hidden>#</span>
                  </th>
                  <th
                    scope="col"
                    className="sticky left-9 z-20 border-r border-b border-line bg-wash-2 px-3 py-2 text-[11px] font-bold tracking-wide text-muted uppercase"
                  >
                    Product
                  </th>
                  {["Batch", "Expiry"].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="border-b border-line bg-wash-2 px-2 py-2 text-[11px] font-bold tracking-wide text-muted uppercase"
                    >
                      {label}
                    </th>
                  ))}
                  {["Qty", "Free", "Rate", "MRP"].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="border-b border-line bg-wash-2 px-2 py-2 text-right text-[11px] font-bold tracking-wide text-muted uppercase"
                    >
                      {label}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="border-b border-line bg-wash-2 px-2 py-2 text-[11px] font-bold tracking-wide text-muted uppercase"
                  >
                    GST %
                  </th>
                  <th scope="col" className="border-b border-line bg-wash-2 px-2 py-2">
                    <span className="sr-only">Delete</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const marked = index + 1 === fault;
                  const sticky = cn(
                    "sticky z-[1] border-b border-line",
                    marked ? "bg-rose-bg" : "bg-paper group-hover:bg-wash-2",
                  );
                  return (
                    <tr
                      key={line.key}
                      id={`prep-row-${index + 1}`}
                      className={cn("group", marked ? "bg-rose-bg" : "hover:bg-wash-2")}
                    >
                      <td className={cn(sticky, "left-0 w-9 px-1 text-center")}>
                        <span className="text-[12px] tabular-nums text-faint">{index + 1}</span>
                      </td>
                      <th
                        scope="row"
                        className={cn(sticky, "left-9 border-r px-3 py-1.5 text-left")}
                      >
                        <span
                          className="block truncate text-[13px] font-bold"
                          title={line.productName}
                        >
                          {line.productName}
                        </span>
                        <span className="block truncate font-mono text-[11px] font-medium text-muted">
                          {line.productId}
                        </span>
                      </th>
                      <td className="border-b border-line p-1">
                        <Input
                          aria-label={`Batch for ${line.productName}`}
                          className={cn(sheetField, "w-full min-w-0")}
                          value={line.batchNo}
                          maxLength={40}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          enterKeyHint="next"
                          onChange={(event) => update(line.key, "batchNo", event.target.value)}
                        />
                      </td>
                      <td className="border-b border-line p-1">
                        <Input
                          aria-label={`Expiry for ${line.productName}`}
                          type="month"
                          className={cn(sheetField, "w-full min-w-0")}
                          value={line.expiry}
                          onChange={(event) => update(line.key, "expiry", event.target.value)}
                        />
                      </td>
                      {(
                        [
                          ["qty", "Qty", "numeric"],
                          ["free", "Free", "numeric"],
                          ["rate", "Rate", "decimal"],
                          ["mrp", "MRP", "decimal"],
                        ] as const
                      ).map(([field, label, mode]) => (
                        <td key={field} className="border-b border-line p-1">
                          <Input
                            aria-label={`${label} for ${line.productName}`}
                            className={cn(sheetField, "w-full text-right tabular-nums")}
                            inputMode={mode}
                            enterKeyHint="next"
                            value={line[field]}
                            onChange={(event) => update(line.key, field, event.target.value)}
                          />
                        </td>
                      ))}
                      <td className="border-b border-line p-1">
                        <select
                          aria-label={`GST for ${line.productName}`}
                          data-slot="select"
                          className={selectClass}
                          value={line.gst}
                          onChange={(event) => update(line.key, "gst", event.target.value)}
                        >
                          <option value="">—</option>
                          <option value="0">0</option>
                          <option value="5">5</option>
                          <option value="12">12</option>
                          <option value="18">18</option>
                        </select>
                      </td>
                      <td className="border-b border-line px-2">
                        <Button
                          type="button"
                          variant="line"
                          size="sm"
                          aria-label={`Delete ${line.productName}`}
                          className="size-8 border-transparent px-0 text-muted hover:border-[#dc26262e] hover:bg-rose-bg hover:text-rose"
                          onClick={() => {
                            setLines((rows) => rows.filter((row) => row.key !== line.key));
                            setNotice(null);
                          }}
                        >
                          <IconTrash />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {leaveOpen ? (
        <ConfirmDialog
          title="Save this list?"
          body="You have unsaved changes."
          tone="caution"
          busy={saveState.isLoading}
          onClose={() => setLeaveOpen(false)}
        >
          <Button type="button" variant="line" onClick={() => setLeaveOpen(false)}>
            Stay
          </Button>
          <Button type="button" variant="line" onClick={leave}>
            Leave
          </Button>
          <Button
            type="button"
            disabled={saveState.isLoading}
            onClick={() => {
              void persist().then((ok) => {
                if (ok) leave();
              });
            }}
          >
            Save
          </Button>
        </ConfirmDialog>
      ) : null}
    </Stack>
  );
}

function fromServer(line: PrepLine): DraftLine {
  return {
    key: `saved-${line.position}-${line.productId}`,
    productId: line.productId,
    productName: line.productName,
    batchNo: line.batchNo ?? "",
    expiry: line.expiry ?? "",
    qty: line.qty == null ? "" : String(line.qty),
    free: line.free == null ? "" : String(line.free),
    rate: line.rate == null ? "" : String(line.rate),
    mrp: line.mrp == null ? "" : String(line.mrp),
    gst: line.gst == null ? "" : String(line.gst),
  };
}

function bodyOf(lines: DraftLine[]): LineBody[] {
  return lines.map((line) => ({
    productId: line.productId,
    productName: line.productName,
    batchNo: line.batchNo.trim() || null,
    expiry: line.expiry || null,
    qty: line.qty === "" ? null : Number(line.qty),
    free: line.free === "" ? null : Number(line.free),
    rate: line.rate === "" ? null : Number(line.rate),
    mrp: line.mrp === "" ? null : Number(line.mrp),
    gst: line.gst === "" ? null : Number(line.gst),
  }));
}

function validate(lines: DraftLine[]): string | null {
  const seen = new Set<string>();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const row = index + 1;
    const batch = line.batchNo.trim();
    if (batch.length > 40) return `Row ${row}: Batch number is not valid`;
    if (line.expiry && !/^\d{4}-(0[1-9]|1[0-2])$/.test(line.expiry))
      return `Row ${row}: Expiry is not valid`;
    if (line.qty && !/^\d+$/.test(line.qty)) return `Row ${row}: Quantity must be a whole number`;
    if (line.free && !/^\d+$/.test(line.free)) return `Row ${row}: Quantity must be a whole number`;
    if (line.rate && !/^(?:\d+|\d+\.\d{1,2})$/.test(line.rate))
      return `Row ${row}: Rate is not valid`;
    if (line.mrp && !/^(?:\d+|\d+\.\d{1,2})$/.test(line.mrp)) return `Row ${row}: MRP is not valid`;
    if (line.gst && !["0", "5", "12", "18"].includes(line.gst)) {
      return `Row ${row}: GST percent is not recognised`;
    }
    const key = `${line.productId}\n${batch}`;
    if (seen.has(key)) return "This product and batch is already on the list";
    seen.add(key);
  }
  return null;
}

function exportProblem(lines: DraftLine[]): string | null {
  if (lines.length === 0) return "Add at least one row";
  const shape = validate(lines);
  if (shape) return shape;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const row = index + 1;
    if (!line.batchNo.trim()) return `Row ${row}: Batch number is required`;
    if (!line.expiry) return `Row ${row}: Expiry is not valid`;
    if (line.qty === "" || line.free === "") return `Row ${row}: Quantity must be a whole number`;
    if (Number(line.qty) === 0 && Number(line.free) === 0)
      return `Row ${row}: Add at least one unit`;
    if (!line.rate) return `Row ${row}: Rate is not valid`;
    if (!line.mrp) return `Row ${row}: MRP is not valid`;
    if (!line.gst) return `Row ${row}: GST percent is not recognised`;
  }
  return null;
}

function focusRow(detail: string) {
  const match = /^Row (\d+)/.exec(detail);
  if (!match) return;
  const row = document.getElementById(`prep-row-${match[1]}`);
  if (typeof row?.scrollIntoView === "function") row.scrollIntoView({ block: "center" });
  const field = row?.querySelector("input, select");
  if (field instanceof HTMLElement) field.focus();
}

function SheetStatus({
  dirty,
  notice,
  updated,
}: {
  dirty: boolean;
  notice: string | null;
  updated: string | null;
}) {
  if (dirty) {
    return (
      <span className="rounded-full bg-amber-bg px-2 py-0.5 text-[11px] font-bold tracking-wide text-amber uppercase">
        Unsaved
      </span>
    );
  }
  if (notice) {
    return (
      <Text role="status" className="text-[12px] font-bold text-mid">
        {notice}
      </Text>
    );
  }
  if (updated) {
    return <span className="hidden text-[12px] text-muted sm:inline">{updated}</span>;
  }
  return null;
}

function faultRow(detail: string | null) {
  const match = detail ? /^Row (\d+)/.exec(detail) : null;
  return match ? Number(match[1]) : 0;
}

function updatedLabel(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Updated ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date)}`;
}

function IconBack() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 6 9 12l6 6" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
