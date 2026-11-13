import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { CardLine, FitText } from "@/components/ui/FitText";
import { FilterField } from "@/components/ui/FilterField";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { PageBar } from "@/components/ui/PageBar";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useDebounced } from "@/hooks/useDebounced";
import { useRegisterQuery } from "@/hooks/useRegisterQuery";
import { problemMessage, useAuthState } from "@/features/authentication";
import { useListPurchasesQuery } from "@/features/purchases";
import { cn } from "@/utils/className";
import {
  cost,
  expiringCost,
  expiryLabel,
  expiryTone,
  inr,
  inventoryAccess,
  inventoryCsv,
  isExpiring,
  isLow,
  isOut,
  locationLabel,
  nearestExpiry,
  retail,
  tableComposition,
  units,
  type ExpiryTone,
  type InventoryFilter,
  type InventoryProduct,
} from "../../model";
import {
  useLazyListInventoryQuery,
  useListInventoryQuery,
  useSetLocationMutation,
} from "../../inventory.api";

const headCell =
  "sticky top-0 z-[1] border-b border-line bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] whitespace-nowrap text-muted uppercase";
const bodyCell = "border-b border-line px-3.5 py-[11px] align-middle text-[13px] text-ink-2";
const footCell =
  "border-t-2 border-line-2 bg-wash-2 px-3.5 py-[11px] text-[13px] font-extrabold text-ink-2";
const sectionLabel = "mb-2 text-[11px] font-extrabold tracking-[0.08em] text-faint uppercase";
const pillTone: Record<ExpiryTone, string> = {
  rose: "bg-rose-bg text-rose",
  gold: "bg-amber-bg text-gold-d",
  gray: "bg-gray-pill text-muted",
};

const FILTERS: { id: InventoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "low", label: "Low stock" },
  { id: "out", label: "Out of stock" },
  { id: "expiring", label: "Expiring" },
  { id: "expired", label: "Expired" },
];

const FILTER_IDS: InventoryFilter[] = ["all", "low", "out", "expiring", "expired"];

export function InventoryPage() {
  const navigate = useNavigate();
  const register = useRegisterQuery();
  const { session } = useAuthState();
  const access = inventoryAccess(session?.account.pharmacyRole, session?.account.permissions);
  const stored = register.get("filter");
  const filter: InventoryFilter = FILTER_IDS.includes(stored as InventoryFilter)
    ? (stored as InventoryFilter)
    : "all";
  const [selected, setSelected] = useState<string | null>(null);
  const needle = useDebounced(register.q.trim());
  const list = useListInventoryQuery({
    page: register.page,
    size: 25,
    q: needle || undefined,
    filter: filter === "all" ? undefined : filter,
  });
  const [loadInventory, exportState] = useLazyListInventoryQuery();
  const productCache = useRef<InventoryProduct[]>([]);
  if (list.data?.products) productCache.current = list.data.products;
  const products = list.data?.products ?? productCache.current;
  const summary = list.data?.summary;
  const stockUnits =
    summary?.unitCount ?? products.reduce((sum, product) => sum + units(product), 0);
  const outCount = summary?.outCount ?? products.filter(isOut).length;
  const skuCount = summary?.skuCount ?? products.length;
  const costValue = summary
    ? money(summary.cost)
    : products.reduce((sum, product) => sum + cost(product), 0);
  const retailValue = summary
    ? money(summary.retail)
    : products.reduce((sum, product) => sum + retail(product), 0);
  const lowAndOut =
    summary?.lowCount ??
    products.filter((product) => units(product) <= product.reorderLevel).length;
  const expiringCount =
    summary?.expiringCount ?? products.filter((product) => isExpiring(product)).length;
  const expiringValue = summary
    ? money(summary.expiringCost)
    : products.reduce((sum, product) => sum + expiringCost(product), 0);

  async function exportFiltered() {
    const collected: InventoryProduct[] = [];
    let pageNo = 1;
    let total = Number.POSITIVE_INFINITY;
    while (collected.length < total) {
      const page = await loadInventory({
        page: pageNo,
        size: 100,
        q: needle || undefined,
        filter: filter === "all" ? undefined : filter,
      }).unwrap();
      collected.push(...page.products);
      total = page.total ?? collected.length;
      if (page.products.length === 0) break;
      pageNo += 1;
    }
    download(inventoryCsv(collected));
  }

  if (list.isLoading && !list.data && productCache.current.length === 0) {
    return <Text className="text-[13.5px] text-muted">Loading inventory</Text>;
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-4 flex items-start justify-between gap-4">
        <Box>
          <Heading level={2}>Inventory</Heading>
          <Text className="text-[13px] text-muted">Stock, batches and expiry</Text>
        </Box>
        <Box className="flex gap-2">
          {access.export ? (
            <Button
              type="button"
              variant="ghost"
              disabled={exportState.isFetching}
              onClick={() => void exportFiltered()}
            >
              Export
            </Button>
          ) : null}
          {access.purchase ? (
            <Button type="button" onClick={() => navigate("/purchases?new=1")}>
              Purchase
            </Button>
          ) : null}
        </Box>
      </Box>
      <Box className="mb-4 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-3">
        <Stat label="Total SKUs" value={String(skuCount)} hint={`${stockUnits} units`} />
        <Stat label="Stock value at cost" value={inr(costValue)} />
        <Stat label="Retail value at MRP" value={inr(retailValue)} />
        <Stat
          label="Low and out of stock"
          value={String(lowAndOut)}
          hint={`${outCount} out of stock`}
          onClick={() => register.setQuery({ filter: "low" })}
        />
        <Stat
          label="Expiring within 4 months"
          value={String(expiringCount)}
          hint={inr(expiringValue)}
          onClick={() => register.setQuery({ filter: "expiring" })}
        />
      </Box>
      <Stack direction="row" align="end" wrap className="mb-3 gap-3">
        <FilterField label="Stock">
          <Stack direction="row" wrap className="gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={filter === item.id ? "primary" : "ghost"}
                onClick={() => register.setQuery({ filter: item.id === "all" ? null : item.id })}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </FilterField>
        <FilterField label="Search" className="w-[280px]">
          <Input
            aria-label="Search inventory"
            placeholder="Name, batch, rack, manufacturer…"
            value={register.q}
            onChange={(event) => register.setQuery({ q: event.target.value })}
          />
        </FilterField>
      </Stack>
      <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
        <Box className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px] [&_tbody_tr:last-child_td]:border-b-0">
            <thead>
              <tr>
                {["Product", "Location", "Type", "Batches", "Expiry", "Stock", "MRP", "Value"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className={cn(
                        headCell,
                        ["Batches", "Stock", "MRP", "Value"].includes(heading) && "text-right",
                      )}
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const shown = product.batches.filter((batch) => batch.qty > 0);
                const expiry = nearestExpiry(product);
                const subtitle = [tableComposition(product.composition), product.marketer]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <tr
                    key={product.productId}
                    className="cursor-pointer transition-colors duration-100 hover:bg-wash-2"
                    onClick={() => setSelected(product.productId)}
                  >
                    <td className={bodyCell}>
                      <Button
                        type="button"
                        variant="link"
                        className="text-[13px] font-bold text-ink"
                        onClick={() => setSelected(product.productId)}
                      >
                        {product.name}
                      </Button>
                      <Text className="text-[12px] leading-normal text-muted">
                        {subtitle || "—"}
                      </Text>
                    </td>
                    <td className={cn(bodyCell, "font-mono whitespace-nowrap")}>
                      {locationLabel(product)}
                    </td>
                    <td className={cn(bodyCell, "whitespace-nowrap")}>{product.type ?? "—"}</td>
                    <td className={cn(bodyCell, "text-right font-semibold")}>{shown.length}</td>
                    <td className={bodyCell}>{expiry ? <ExpiryPill expiry={expiry} /> : "—"}</td>
                    <td
                      className={cn(
                        bodyCell,
                        "text-right font-bold",
                        isOut(product) && "text-rose",
                        isLow(product) && "text-gold-d",
                      )}
                    >
                      {units(product)}
                    </td>
                    <td
                      className={cn(
                        bodyCell,
                        "text-right font-bold whitespace-nowrap tabular-nums",
                      )}
                    >
                      {shown[0] ? inr(Number(shown[0].mrp)) : "—"}
                    </td>
                    <td
                      className={cn(
                        bodyCell,
                        "text-right font-semibold whitespace-nowrap tabular-nums",
                      )}
                    >
                      {inr(cost(product))}
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className={bodyCell}>
                    <Text className="px-3.5 py-8 text-center text-[13px] text-muted">
                      No products match this filter.
                    </Text>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Box>
        <PageBar
          page={list.data?.page ?? register.page}
          size={list.data?.size ?? 25}
          total={list.data?.total ?? products.length}
          onPage={(next) => register.setQuery({ page: next })}
        />
      </Box>
      {selected ? (
        <ProductDialog
          product={products.find((product) => product.productId === selected) ?? null}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </Box>
  );
}

function money(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function Stat({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <Box
      className="min-w-0 max-w-full overflow-hidden rounded-md border border-line bg-paper p-4"
      onClick={onClick}
    >
      <CardLine className="text-[11px] font-bold text-muted uppercase">{label}</CardLine>
      <FitText className="text-[22px] font-bold text-dark">{value}</FitText>
      {hint ? <CardLine className="text-[12px] text-muted">{hint}</CardLine> : null}
    </Box>
  );
}

export function ProductDialog({
  product,
  onClose,
  onLocationSaved,
}: {
  product: InventoryProduct | null;
  onClose: () => void;
  onLocationSaved?: () => void;
}) {
  const navigate = useNavigate();
  const { session } = useAuthState();
  const canPlace =
    session?.account.pharmacyRole === "owner" ||
    (session?.account.permissions ?? []).includes("racks:update");
  const [tab, setTab] = useState<"details" | "batches">("details");
  const [historyPage, setHistoryPage] = useState(1);
  const [rack, setRack] = useState(product?.rack ?? "");
  const [alt, setAlt] = useState(product?.rackAlt ?? "");
  const [setLocation, locationState] = useSetLocationMutation();
  const history = useListPurchasesQuery(
    { productId: product?.productId, page: historyPage, size: 25 },
    { skip: !product || tab !== "batches" },
  );
  const batches = useMemo(
    () => (product?.batches ?? []).filter((batch) => batch.qty > 0),
    [product],
  );
  useEffect(() => {
    setRack(product?.rack ?? "");
    setAlt(product?.rackAlt ?? "");
    setHistoryPage(1);
  }, [product]);
  if (!product) return null;
  const stock = units(product);
  const purchases = history.data?.purchases ?? [];
  const expiry = nearestExpiry(product);
  const dirty =
    rack.trim().toUpperCase() !== (product.rack ?? "").trim().toUpperCase() ||
    alt.trim().toUpperCase() !== (product.rackAlt ?? "").trim().toUpperCase();
  const detailRows: { label: string; value: ReactNode }[] = [
    { label: "Marketer", value: product.marketer ?? "—" },
    { label: "Composition", value: product.composition ?? "—" },
    { label: "Form", value: product.form ?? "—" },
    { label: "Pack", value: product.pack ?? "—" },
    { label: "Type", value: product.type ?? "—" },
    { label: "Stock", value: String(stock) },
    { label: "Cost value", value: inr(cost(product)) },
    { label: "Retail value", value: inr(retail(product)) },
    { label: "Nearest expiry", value: expiry ? <ExpiryPill expiry={expiry} /> : "—" },
  ];
  return (
    <Box
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          gap={3}
          className="border-b border-line px-5 py-4"
        >
          <Box className="min-w-0">
            <Heading level={3} className="text-[17px]">
              {product.name}
            </Heading>
            {isOut(product) || isLow(product) ? (
              <Text className="mt-1  flex w-fit rounded-full bg-rose-bg px-[9px] py-[3px] text-[11px] font-bold text-rose">
                {isOut(product) ? "Out of stock — reorder now" : "Low stock — at or under reorder"}
              </Text>
            ) : null}
          </Box>
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            ×
          </Button>
        </Stack>
        <Box className="overflow-y-auto px-5 py-5">
          <Box className="mb-4 inline-flex gap-1 rounded-sm border border-line bg-wash-2 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={tab === "details" ? "primary" : "ghost"}
              className={tab === "details" ? undefined : "border-transparent bg-transparent"}
              onClick={() => setTab("details")}
            >
              Details
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tab === "batches" ? "primary" : "ghost"}
              className={tab === "batches" ? undefined : "border-transparent bg-transparent"}
              onClick={() => setTab("batches")}
            >
              Batches
            </Button>
          </Box>
          {tab === "details" ? (
            <Box>
              <Text className={sectionLabel}>Product details</Text>
              <DataTable headings={["Detail", "Value"]} alignRight={[false, false]}>
                {detailRows.map(({ label, value }) => (
                  <tr key={label} className="transition-colors duration-100 hover:bg-wash-2">
                    <td className={cn(bodyCell, "w-[180px] font-semibold text-muted")}>{label}</td>
                    <td className={cn(bodyCell, "font-semibold text-ink")}>{value}</td>
                  </tr>
                ))}
                <tr className="transition-colors duration-100 hover:bg-wash-2">
                  <td className={cn(bodyCell, "w-[180px] font-semibold text-muted")}>
                    Rack location
                  </td>
                  <td className={cn(bodyCell, "font-semibold text-ink")}>
                    {canPlace ? (
                      <Box className="flex items-center gap-2">
                        <Input
                          aria-label="Rack location"
                          value={rack}
                          onChange={(event) => setRack(event.target.value.toUpperCase())}
                          placeholder="A3-12"
                          className="w-[110px] font-mono"
                        />
                        <Input
                          aria-label="2nd slot"
                          value={alt}
                          onChange={(event) => setAlt(event.target.value.toUpperCase())}
                          placeholder="2nd slot"
                          className="w-[110px] font-mono"
                        />
                        <Button
                          type="button"
                          size="md"
                          disabled={!dirty || locationState.isLoading}
                          onClick={() => {
                            void setLocation({
                              productId: product.productId,
                              rack: rack.trim(),
                              rackAlt: alt.trim(),
                            })
                              .unwrap()
                              .then(() => onLocationSaved?.())
                              .catch(() => undefined);
                          }}
                        >
                          Save location
                        </Button>
                        {locationState.isError ? (
                          <Text className="text-[12.5px] text-rose">
                            {problemMessage(locationState.error, "Could not set the location")}
                          </Text>
                        ) : null}
                      </Box>
                    ) : (
                      locationLabel(product)
                    )}
                  </td>
                </tr>
              </DataTable>
            </Box>
          ) : (
            <Box>
              <Text className={sectionLabel}>Batches · stock & expiry</Text>
              <DataTable
                headings={["Batch", "Expiry", "Qty", "Rate", "MRP", "Value"]}
                alignRight={[false, false, true, true, true, true]}
                footer={
                  batches.length > 0 ? (
                    <tr>
                      <td colSpan={2} className={footCell}>
                        Total
                      </td>
                      <td className={cn(footCell, "text-right tabular-nums")}>{stock}</td>
                      <td className={footCell} />
                      <td className={footCell} />
                      <td className={cn(footCell, "text-right whitespace-nowrap tabular-nums")}>
                        {inr(cost(product))}
                      </td>
                    </tr>
                  ) : null
                }
              >
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={bodyCell}>
                      <Text className="px-3.5 py-3.5 text-center text-[13px] text-muted">
                        No stock.
                      </Text>
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr
                      key={batch.batchNo}
                      className="transition-colors duration-100 hover:bg-wash-2"
                    >
                      <td className={cn(bodyCell, "font-mono font-bold text-ink")}>
                        {batch.batchNo || "—"}
                      </td>
                      <td className={bodyCell}>
                        <ExpiryPill expiry={batch.expiry} />
                      </td>
                      <td className={cn(bodyCell, "text-right font-bold tabular-nums")}>
                        {batch.qty}
                      </td>
                      <td
                        className={cn(
                          bodyCell,
                          "text-right font-semibold whitespace-nowrap tabular-nums",
                        )}
                      >
                        {inr(Number(batch.rate))}
                      </td>
                      <td
                        className={cn(
                          bodyCell,
                          "text-right font-semibold whitespace-nowrap tabular-nums",
                        )}
                      >
                        {inr(Number(batch.mrp))}
                      </td>
                      <td
                        className={cn(
                          bodyCell,
                          "text-right font-semibold whitespace-nowrap tabular-nums",
                        )}
                      >
                        {inr(Number(batch.rate) * batch.qty)}
                      </td>
                    </tr>
                  ))
                )}
              </DataTable>
              <Text className={cn(sectionLabel, "mt-5")}>Purchase history</Text>
              <DataTable
                headings={["Document", "Type", "Invoice", "Date", "Total"]}
                alignRight={[false, false, false, false, true]}
              >
                {history.isLoading ? (
                  <tr>
                    <td colSpan={5} className={bodyCell}>
                      <Text className="px-3.5 py-3.5 text-center text-[13px] text-muted">
                        Loading purchases
                      </Text>
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={bodyCell}>
                      <Text className="px-3.5 py-3.5 text-center text-[13px] text-muted">
                        No purchases recorded.
                      </Text>
                    </td>
                  </tr>
                ) : (
                  purchases.map((row) => (
                    <tr key={row.id} className="transition-colors duration-100 hover:bg-wash-2">
                      <td className={bodyCell}>
                        <Button
                          type="button"
                          variant="link"
                          className="font-mono text-[12.5px] font-bold"
                          onClick={() => navigate(`/purchases/${row.id}`)}
                        >
                          {row.id}
                        </Button>
                      </td>
                      <td className={cn(bodyCell, "font-semibold capitalize")}>{row.type}</td>
                      <td className={bodyCell}>{row.invoiceNo || "—"}</td>
                      <td className={cn(bodyCell, "whitespace-nowrap")}>
                        {row.invoiceDate || "—"}
                      </td>
                      <td
                        className={cn(
                          bodyCell,
                          "text-right font-bold whitespace-nowrap tabular-nums",
                        )}
                      >
                        {inr(Number(row.total))}
                      </td>
                    </tr>
                  ))
                )}
              </DataTable>
              <PageBar
                page={history.data?.page ?? historyPage}
                size={history.data?.size ?? 25}
                total={history.data?.total ?? purchases.length}
                onPage={setHistoryPage}
              />
            </Box>
          )}
        </Box>
        <Stack direction="row" justify="end" className="border-t border-line px-5 py-3.5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

function DataTable({
  headings,
  alignRight,
  footer,
  children,
}: {
  headings: string[];
  alignRight: boolean[];
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
      <Box className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 [&_tbody_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              {headings.map((heading, index) => (
                <th key={heading} className={cn(headCell, alignRight[index] && "text-right")}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
          {footer ? <tfoot>{footer}</tfoot> : null}
        </table>
      </Box>
    </Box>
  );
}

function ExpiryPill({ expiry }: { expiry: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap",
        pillTone[expiryTone(expiry)],
      )}
    >
      {expiryLabel(expiry)}
    </span>
  );
}

function download(csv: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "inventory.csv";
  link.click();
  URL.revokeObjectURL(url);
}
