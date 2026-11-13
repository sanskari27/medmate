import { Link } from "react-router-dom";
import type { KeyboardEvent, RefObject } from "react";
import type { InventoryProduct } from "@/features/inventory";
import { Box } from "@/components/ui/Box";
import { Text } from "@/components/ui/Text";
import { hintBatch, sellableUnits } from "../../../../model";
import { rupee, shortComposition } from "../../billingView";

export function BillingSearch({
  query,
  highlight,
  results,
  total,
  scanRef,
  onQuery,
  onKeyDown,
  onClear,
  onPick,
}: {
  query: string;
  highlight: number;
  results: InventoryProduct[];
  total: number;
  scanRef: RefObject<HTMLInputElement | null>;
  onQuery: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onPick: (product: InventoryProduct) => void;
}) {
  return (
    <Box className="relative shrink-0">
      <Box className="flex items-center gap-2 rounded-md border border-line bg-paper px-2.5 py-1 shadow-sm focus-within:border-dark focus-within:shadow-[0_0_0_2px_#1b3d29,0_0_0_4px_rgba(27,61,41,0.16)]">
        <Text
          as="span"
          className="shrink-0 text-[10px] font-bold tracking-wide text-dark uppercase"
        >
          Search
        </Text>
        <input
          id="billing-scan"
          ref={scanRef}
          aria-label="Scan or search"
          placeholder="Product id, name, or composition"
          value={query}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={onKeyDown}
          className="h-7 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink outline-none placeholder:text-faint"
        />
        {query ? (
          <button
            type="button"
            tabIndex={-1}
            className="shrink-0 rounded-xs bg-canvas px-1.5 py-0.5 text-[10px] font-semibold text-muted"
            onMouseDown={(event) => {
              event.preventDefault();
              onClear();
            }}
          >
            Clear
          </button>
        ) : null}
        <Text
          as="span"
          className="hidden shrink-0 items-center gap-2 border-l border-line pl-2 text-[10px] text-muted xl:flex"
        >
          <Hint keys="Tab" label="Next" />
          <Hint keys="F3" label="Search" />
          <Hint keys="F2" label="Special" />
          <Hint keys="F4" label="Phone" />
          <Hint keys="Ctrl+Enter" label="Charge" />
        </Text>
      </Box>
      {results.length > 0 ? (
        <Box
          role="listbox"
          aria-label="Matches"
          className="absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-auto rounded-md border border-line bg-paper shadow-pop"
        >
          <Box className="sticky top-0 flex items-center justify-between border-b border-line bg-canvas px-2.5 py-1 text-[10px] font-bold tracking-wide text-faint uppercase">
            <span>
              {results.length} of {total}
            </span>
            {total > results.length ? (
              <Link
                to={`/inventory?q=${encodeURIComponent(query)}`}
                className="font-bold text-dark normal-case"
              >
                See all in inventory
              </Link>
            ) : (
              <span>↑↓ move · Enter add · Esc close</span>
            )}
          </Box>
          {results.map((product, index) => {
            const hint = hintBatch(product);
            const units = sellableUnits(product);
            const composition = shortComposition(product.composition);
            return (
              <button
                key={product.productId}
                type="button"
                tabIndex={-1}
                role="option"
                aria-selected={index === highlight}
                title={composition}
                className={`grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-2.5 py-1.5 text-left ${index === highlight ? "border-l-2 border-dark bg-wash" : "border-l-2 border-transparent"}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onPick(product);
                }}
              >
                <Text as="span" className="truncate text-[13px] font-bold">
                  {product.name}
                </Text>
                <Text as="span" className="font-mono text-[12px] whitespace-nowrap tabular-nums">
                  {hint ? rupee(Number(hint.mrp)) : "—"}
                </Text>
                <Text as="span" className="col-span-2 truncate text-[11px] text-muted">
                  {composition} · {product.productId} · {units} in stock
                </Text>
              </button>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="rounded border border-line-2 bg-canvas px-1 py-px font-mono text-[10px] font-semibold text-ink-2">
        {keys}
      </kbd>
      {label}
    </span>
  );
}
