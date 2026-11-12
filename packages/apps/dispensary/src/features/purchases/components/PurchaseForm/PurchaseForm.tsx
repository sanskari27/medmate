import { useEffect, useRef, useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useListDistributorsQuery } from "@/features/distributors";
import { cn } from "@/utils/className";
import { downloadSample } from "../../csv";
import {
  blankLine,
  draftReady,
  inr2,
  lineComplete,
  type DraftLine,
  type MedicineHit,
  type PurchaseDraft,
} from "../../model";
import { useLazySearchMedicinesQuery } from "../../purchases.api";

const searchDelayMs = 300;

const headerSelectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none hover:border-[#b9d0c2] focus:border-mid focus:shadow-focus";

const lineSelectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-1.5 text-xs text-ink outline-none hover:border-[#b9d0c2] focus:border-mid focus:shadow-focus";

export function PurchaseForm({
  initial,
  issues,
  saving,
  error,
  onClose,
  onImport,
  onSave,
}: {
  initial?: PurchaseDraft;
  issues: string[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onImport: (text: string) => Promise<DraftLine[] | null>;
  onSave: (draft: PurchaseDraft) => void;
}) {
  const distributors = useListDistributorsQuery();
  const [search] = useLazySearchMedicinesQuery();
  const file = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequest = useRef<{ abort: () => void; unsubscribe: () => void } | null>(null);
  const searchGeneration = useRef(0);
  const medicineFields = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingFocus = useRef<string | null>(null);
  const [draft, setDraft] = useState<PurchaseDraft>(() => blankDraft(initial));
  const [hits, setHits] = useState<Record<string, MedicineHit[]>>({});
  const [activeHit, setActiveHit] = useState(0);
  const [menuBox, setMenuBox] = useState<MenuBox | null>(null);
  const choices = (distributors.data?.distributors ?? []).filter(
    (row) => row.active && row.showInPurchases,
  );
  const summary = summarize(draft.lines);
  const openKey = Object.keys(hits).find((key) => (hits[key]?.length ?? 0) > 0) ?? null;

  useEffect(() => {
    const key = pendingFocus.current;
    if (!key) return;
    pendingFocus.current = null;
    medicineFields.current[key]?.focus();
  }, [draft.lines]);

  useEffect(() => {
    if (!openKey) return;
    const key = openKey;
    function place() {
      setMenuBox(placeMenu(medicineFields.current[key]));
    }
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [openKey, hits]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchRequest.current?.abort();
      searchRequest.current?.unsubscribe();
    };
  }, []);

  function lookup(key: string, value: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = null;
    const ticket = ++searchGeneration.current;
    searchRequest.current?.abort();
    searchRequest.current?.unsubscribe();
    searchRequest.current = null;
    const query = value.trim();
    setMenuBox(null);
    if (query.length < 2) {
      setHits({});
      return;
    }
    searchTimer.current = setTimeout(() => {
      const request = search(query);
      searchRequest.current = request;
      void request
        .then((result) => {
          if (ticket !== searchGeneration.current) return;
          setActiveHit(0);
          setHits({ [key]: result.data?.medicines ?? [] });
        })
        .catch(() => undefined);
    }, searchDelayMs);
  }

  function choose(line: DraftLine, hit: MedicineHit) {
    updateLine(line.key, {
      productId: hit.productId,
      name: hit.name,
      mrp: hit.mrp == null ? line.mrp : String(hit.mrp),
    });
    setHits({});
    setMenuBox(null);
  }

  function addLine() {
    const next = blankLine();
    pendingFocus.current = next.key;
    setDraft((current) => ({ ...current, lines: [...current.lines, next] }));
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    }));
  }

  function removeLine(key: string) {
    setDraft((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.key !== key),
    }));
    setHits((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function importCsv(chosen: File) {
    const lines = await onImport(await chosen.text());
    if (!lines) return;
    setDraft((current) => ({
      ...current,
      lines: lines.length > 0 ? lines : [blankLine()],
    }));
    setHits({});
  }

  return (
    <Box
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-4 backdrop-blur-[3px] md:p-6"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="New purchase entry"
        className="flex h-[min(880px,calc(100vh-2rem))] w-full max-w-[1200px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          gap={3}
          wrap
          className="border-b border-line px-5 py-4"
        >
          <Box className="min-w-0">
            <Heading level={3}>New purchase entry</Heading>
            <Text variant="caption">Goods inward from a distributor bill</Text>
          </Box>
          <Stack direction="row" align="center" justify="end" gap={2} wrap>
            <Button type="button" variant="ghost" size="sm" onClick={downloadSample}>
              Download sample
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => file.current?.click()}
            >
              Upload CSV
            </Button>
            <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
              Close
            </Button>
            <input
              ref={file}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              aria-label="Purchase CSV"
              onChange={(event) => {
                const chosen = event.target.files?.[0];
                event.target.value = "";
                if (!chosen) return;
                void importCsv(chosen);
              }}
            />
          </Stack>
        </Stack>
        <Box className="shrink-0 border-b border-line px-5 py-3">
          <Box className="grid gap-3 md:grid-cols-3">
            <Field label="Distributor / supplier">
              <select
                aria-label="Distributor"
                className={headerSelectClass}
                value={draft.distributorId}
                onChange={(event) => setDraft({ ...draft, distributorId: event.target.value })}
              >
                <option value="">Select</option>
                {choices.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Invoice number">
              <Input
                aria-label="Invoice number"
                value={draft.invoiceNo}
                placeholder="BPD/26-27/8842"
                onChange={(event) => setDraft({ ...draft, invoiceNo: event.target.value })}
              />
            </Field>
            <Field label="Invoice date">
              <Input
                aria-label="Invoice date"
                type="date"
                value={draft.invoiceDate}
                onChange={(event) => setDraft({ ...draft, invoiceDate: event.target.value })}
              />
            </Field>
          </Box>
        </Box>
        {issues.length > 0 ? (
          <Box className="shrink-0 border-b border-line px-5 py-2">
            {issues.map((issue) => (
              <Text key={issue} className="text-[12.5px] font-bold text-rose">
                {issue}
              </Text>
            ))}
          </Box>
        ) : null}
        <Box className="flex min-h-0 flex-1 flex-col">
          <Stack
            direction="row"
            align="center"
            justify="between"
            gap={2}
            className="shrink-0 px-5 pt-3 pb-2"
          >
            <Heading level={4} className="text-[14px]">
              Billed items
            </Heading>
            <Text variant="caption">
              {draft.lines.length} lines · free goods are stocked but not charged
            </Text>
          </Stack>
          <Box
            data-line-grid
            className="min-h-0 flex-1 overflow-auto"
            onScroll={() => {
              if (!openKey) return;
              setMenuBox(placeMenu(medicineFields.current[openKey]));
            }}
          >
            <table className="w-full min-w-[1040px] border-separate border-spacing-0 text-[12.5px]">
              <thead>
                <tr>
                  {columns.map((heading) => (
                    <th
                      key={heading.label || "actions"}
                      className={cn(
                        "sticky top-0 z-20 bg-wash-2 px-2 py-2 text-left text-[10.5px] font-bold text-muted uppercase",
                        heading.className,
                        heading.sticky && "left-0 z-30",
                      )}
                    >
                      {heading.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draft.lines.map((line, index) => {
                  const amount = lineAmount(line);
                  const matches = hits[line.key] ?? [];
                  return (
                    <tr key={line.key} className="group">
                      <td className={stickyCell}>
                        <Box
                          className="flex items-center gap-2"
                          ref={(node: HTMLDivElement | null) => {
                            medicineFields.current[line.key] = node?.querySelector("input") ?? null;
                          }}
                        >
                          <Text
                            as="span"
                            className="w-5 shrink-0 text-right text-[11px] text-muted tabular-nums"
                          >
                            {index + 1}
                          </Text>
                          <Input
                            aria-label={`Medicine ${line.name || "line"}`}
                            aria-expanded={matches.length > 0}
                            aria-controls={matches.length > 0 ? "medicine-matches" : undefined}
                            controlSize="sm"
                            value={line.name}
                            placeholder="Search medicine"
                            onChange={(event) => {
                              updateLine(line.key, { name: event.target.value, productId: "" });
                              lookup(line.key, event.target.value);
                            }}
                            onKeyDown={(event) => {
                              if (matches.length === 0) return;
                              if (event.key === "ArrowDown") {
                                event.preventDefault();
                                setActiveHit((current) =>
                                  Math.min(current + 1, matches.length - 1),
                                );
                              } else if (event.key === "ArrowUp") {
                                event.preventDefault();
                                setActiveHit((current) => Math.max(current - 1, 0));
                              } else if (event.key === "Enter") {
                                event.preventDefault();
                                const hit = matches[Math.min(activeHit, matches.length - 1)];
                                if (hit) choose(line, hit);
                              } else if (event.key === "Escape") {
                                setHits({});
                                setMenuBox(null);
                              }
                            }}
                          />
                        </Box>
                      </td>
                      <td className={cell}>
                        <Input
                          aria-label={`Batch ${index + 1}`}
                          controlSize="sm"
                          value={line.batchNo}
                          onChange={(event) =>
                            updateLine(line.key, { batchNo: event.target.value })
                          }
                        />
                      </td>
                      <td className={cell}>
                        <Input
                          aria-label={`Expiry ${index + 1}`}
                          controlSize="sm"
                          type="month"
                          value={line.expiry}
                          onChange={(event) => updateLine(line.key, { expiry: event.target.value })}
                        />
                      </td>
                      <td className={cell}>
                        <Input
                          aria-label={`Quantity ${index + 1}`}
                          controlSize="sm"
                          inputMode="numeric"
                          value={line.qty}
                          onChange={(event) => updateLine(line.key, { qty: event.target.value })}
                        />
                      </td>
                      <td className={cell}>
                        <Input
                          aria-label={`Free quantity ${index + 1}`}
                          controlSize="sm"
                          inputMode="numeric"
                          value={line.freeQty}
                          onChange={(event) =>
                            updateLine(line.key, { freeQty: event.target.value })
                          }
                        />
                      </td>
                      <td className={cell}>
                        <Input
                          aria-label={`Rate ${index + 1}`}
                          controlSize="sm"
                          inputMode="decimal"
                          value={line.rate}
                          onChange={(event) => updateLine(line.key, { rate: event.target.value })}
                        />
                      </td>
                      <td className={cell}>
                        <Input
                          aria-label={`MRP ${index + 1}`}
                          controlSize="sm"
                          inputMode="decimal"
                          value={line.mrp}
                          onChange={(event) => updateLine(line.key, { mrp: event.target.value })}
                        />
                      </td>
                      <td className={cell}>
                        <select
                          aria-label={`GST ${index + 1}`}
                          className={lineSelectClass}
                          value={line.gst}
                          onChange={(event) => updateLine(line.key, { gst: event.target.value })}
                        >
                          <option value="">GST</option>
                          {["0", "5", "12", "18"].map((rate) => (
                            <option key={rate} value={rate}>
                              {rate}%
                            </option>
                          ))}
                        </select>
                      </td>
                      <td
                        className={`${cell} text-right text-[12.5px] font-bold text-dark tabular-nums`}
                      >
                        {amount == null ? "—" : inr2(amount)}
                      </td>
                      <td className={cell}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove item ${index + 1}`}
                          disabled={draft.lines.length === 1}
                          onClick={() => removeLine(line.key)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        </Box>
        {error ? (
          <Text className="shrink-0 px-5 pt-3 text-[12.5px] font-bold text-rose">{error}</Text>
        ) : null}
        <Stack
          direction="row"
          align="center"
          justify="between"
          gap={3}
          wrap
          className="shrink-0 border-t border-line px-5 py-3"
        >
          <Button type="button" variant="ghost" onClick={addLine}>
            Add line
          </Button>
          <Stack direction="row" align="center" justify="end" gap={4} wrap>
            <Text as="span" className="text-[13px] text-muted">
              {summary.units} units
            </Text>
            <Text as="span" className="text-[13px] text-muted">
              Taxable{" "}
              <Text as="span" className="font-bold text-ink">
                {inr2(summary.taxable)}
              </Text>
            </Text>
            <Text as="span" className="text-[13px] text-muted">
              GST{" "}
              <Text as="span" className="font-bold text-ink">
                {inr2(summary.gst)}
              </Text>
            </Text>
            <Text as="span" className="text-[18px] font-bold text-dark">
              Bill {inr2(summary.taxable + summary.gst)}
            </Text>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !draftReady(draft) || saving || draft.lines.filter(lineComplete).length === 0
              }
              onClick={() => onSave(draft)}
            >
              Save purchase
            </Button>
          </Stack>
        </Stack>
      </Box>
      {menuBox && openKey ? (
        <Box
          id="medicine-matches"
          role="listbox"
          className="max-h-52 overflow-x-hidden overflow-y-auto overscroll-x-none rounded-sm border border-line bg-paper shadow-pop"
          style={{
            position: "fixed",
            top: menuBox.top,
            left: menuBox.left,
            width: menuBox.width,
            transform: menuBox.upward ? "translateY(-100%)" : undefined,
            zIndex: 90,
          }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => event.stopPropagation()}
        >
          {(hits[openKey] ?? []).map((hit, index) => (
            <Button
              key={hit.productId}
              type="button"
              role="option"
              aria-selected={index === activeHit}
              variant="ghost"
              size="sm"
              className={`h-auto w-full min-w-0 justify-start rounded-none whitespace-normal text-left ${index === activeHit ? "bg-wash" : ""}`}
              onClick={() => {
                const line = draft.lines.find((item) => item.key === openKey);
                if (line) choose(line, hit);
              }}
            >
              {hit.name}
              {hit.pack ? ` · ${hit.pack}` : ""}
              {hit.marketer ? ` · ${hit.marketer}` : ""}
            </Button>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

type MenuBox = { top: number; left: number; width: number; upward: boolean };

function placeMenu(input: HTMLInputElement | null | undefined): MenuBox | null {
  if (!input) return null;
  const rect = input.getBoundingClientRect();
  const grid = input.closest("[data-line-grid]")?.getBoundingClientRect();
  const dialog = input.closest("[role='dialog']")?.getBoundingClientRect();
  const boundsLeft = Math.max(grid?.left ?? rect.left, dialog?.left ?? rect.left);
  const boundsRight = Math.min(grid?.right ?? rect.right, dialog?.right ?? rect.right);
  const width = Math.min(Math.max(rect.width, 280), Math.max(160, boundsRight - boundsLeft));
  const left = Math.min(Math.max(rect.left, boundsLeft), boundsRight - width);
  const spaceBelow = window.innerHeight - rect.bottom;
  const upward = spaceBelow < 220 && rect.top > spaceBelow;
  return {
    top: upward ? rect.top - 4 : rect.bottom + 4,
    left,
    width,
    upward,
  };
}

const columns = [
  { label: "Medicine", className: "min-w-[260px]", sticky: true },
  { label: "Batch", className: "min-w-[120px]", sticky: false },
  { label: "Expiry", className: "min-w-[132px]", sticky: false },
  { label: "Qty", className: "min-w-[76px]", sticky: false },
  { label: "Free", className: "min-w-[76px]", sticky: false },
  { label: "Rate", className: "min-w-[88px]", sticky: false },
  { label: "MRP", className: "min-w-[88px]", sticky: false },
  { label: "GST", className: "min-w-[84px]", sticky: false },
  { label: "Amount", className: "min-w-[96px] text-right", sticky: false },
  { label: "", className: "min-w-[88px]", sticky: false },
];

const cell =
  "border-t border-line bg-paper px-1.5 py-1.5 group-hover:bg-wash-2 group-focus-within:bg-wash";
const stickyCell = `${cell} sticky left-0 z-10`;

function blankDraft(initial: PurchaseDraft | undefined): PurchaseDraft {
  if (!initial) {
    return { distributorId: "", invoiceNo: "", invoiceDate: "", lines: [blankLine()] };
  }
  return { ...initial, lines: initial.lines.length > 0 ? initial.lines : [blankLine()] };
}

function lineAmount(line: DraftLine): number | null {
  if (line.qty.trim() === "" || line.rate.trim() === "" || line.gst.trim() === "") return null;
  const qty = Number(line.qty);
  const rate = Number(line.rate);
  const gst = Number(line.gst);
  if (!Number.isFinite(qty) || !Number.isFinite(rate) || !Number.isFinite(gst)) return null;
  return rate * qty * (1 + gst / 100);
}

function summarize(lines: DraftLine[]) {
  return lines.reduce(
    (total, line) => {
      const qty = Number(line.qty);
      const free = Number(line.freeQty || "0");
      const rate = Number(line.rate);
      const gst = Number(line.gst);
      const qtyOk = line.qty.trim() !== "" && Number.isFinite(qty) && qty >= 0;
      const freeOk = Number.isFinite(free) && free >= 0;
      const moneyOk =
        line.rate.trim() !== "" &&
        line.gst.trim() !== "" &&
        Number.isFinite(rate) &&
        rate >= 0 &&
        Number.isFinite(gst) &&
        gst >= 0;
      return {
        units: total.units + (qtyOk ? qty : 0) + (freeOk ? free : 0),
        taxable: total.taxable + (qtyOk && moneyOk ? rate * qty : 0),
        gst: total.gst + (qtyOk && moneyOk ? (rate * qty * gst) / 100 : 0),
      };
    },
    { units: 0, taxable: 0, gst: 0 },
  );
}
