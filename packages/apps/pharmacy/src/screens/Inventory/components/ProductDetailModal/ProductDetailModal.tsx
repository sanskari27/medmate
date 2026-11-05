import type { MouseEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { MonoText } from "@/components/atoms/MonoText";
import { Pill } from "@/components/atoms/Pill";
import { Stack } from "@/components/atoms/Stack";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/atoms";
import { Text } from "@/components/atoms/Text";
import {
  IconAlert,
  IconDownload,
  IconEdit,
  IconLock,
  IconPin,
  IconRefresh,
  IconTruck,
  IconUnlock,
  IconX,
} from "@/components/atoms/Icon";
import { ScheduleTag } from "@/components/molecules/ScheduleTag";
import { Thumb } from "@/components/Thumb";
import {
  catLabel,
  fmtDateTime,
  hasLocation,
  inr,
  isExpired,
  isLowStock,
  locationCodes,
  looseUnitsOf,
  monthsToExpiry,
  productBarcode,
  sellPrice,
  stockLabel,
  timeAgo,
  unitNoun,
  type Batch,
} from "@/utils";
import { barcodeSvg, saveBarcodeSvg } from "@/utils/barcode";
import { cn } from "@/utils/className";
import { expiryTone, productInsight, type ProductMovement } from "../../Inventory.utils";
import type { ProductDetailModalProps } from "./ProductDetailModal.types";

const headCell =
  "sticky top-0 bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase";
const bodyCell = "px-3.5 py-[11px] text-[13px] text-ink-2";

export function ProductDetailModal({
  product,
  sales,
  now,
  onClose,
  onEdit,
  toggleOnline,
  go,
}: ProductDetailModalProps) {
  const insight = productInsight(product, sales, now);
  const code = productBarcode(product);

  function keepOpen(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }
  function receive() {
    onClose();
    go("purchases");
  }
  function reorder() {
    onClose();
    go("reorder");
  }
  function assignRack() {
    onClose();
    go("rackmap");
  }
  function toggleStore() {
    toggleOnline(product.id);
  }
  function saveCode() {
    saveBarcodeSvg(code);
  }
  function renderBatch(batch: Batch) {
    const expired = isExpired(batch.expiry, now);
    const months = monthsToExpiry(batch.expiry, now);
    return (
      <TableRow key={batch.batchNo}>
        <TableCell className={`${bodyCell} font-mono font-bold text-ink`}>{batch.batchNo || "—"}</TableCell>
        <TableCell className={bodyCell}>
          <Pill tone={expiryTone(expired, months)}>
            {batch.expiry}
            {expired ? " · exp" : months <= 4 ? ` · ${months}mo` : ""}
          </Pill>
        </TableCell>
        <TableCell align="right" className={`${bodyCell} font-bold text-ink`}>
          {batch.qty}
        </TableCell>
        <TableCell align="right" className={`${bodyCell} font-semibold text-ink`}>
          {inr(batch.mrp)}
        </TableCell>
        <TableCell align="right" className={`${bodyCell} font-semibold text-ink`}>
          {inr(batch.qty * batch.ptr)}
        </TableCell>
      </TableRow>
    );
  }
  function renderMove(move: ProductMovement) {
    return <MovementRow key={move.id} move={move} />;
  }
  const low = isLowStock(product) || insight.stock === 0;

  return (
    <Box
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={keepOpen}
      >
        <Stack direction="row" align="center" justify="between" gap={3} className="border-b border-line px-5 py-4">
          <Stack direction="row" align="center" gap={3} className="min-w-0">
            <Box className="grid h-[42px] w-[42px] shrink-0 place-items-center overflow-hidden rounded-[11px] bg-wash">
              <Thumb p={product} />
            </Box>
            <Box className="min-w-0">
              <Heading level={3} className="flex items-center gap-2 text-[17px]">
                {product.name} <ScheduleTag schedule={product.schedule} />
              </Heading>
              <Text variant="caption" className="mt-0.5 text-[12.5px]">
                {product.composition} · {product.manufacturer} · {catLabel(product.category)}
              </Text>
            </Box>
          </Stack>
          <IconButton label="Close" className="border-0 bg-wash-2" onClick={onClose}>
            <IconX size={18} />
          </IconButton>
        </Stack>
        <Box className="overflow-y-auto px-5 py-5">
          <Stack direction="row" wrap gap={1} className="mb-3.5">
            <Button variant="primary" size="sm" onClick={onEdit}>
              <IconEdit size={14} /> Edit product
            </Button>
            <Button variant="ghost" size="sm" onClick={receive}>
              <IconTruck size={14} /> Receive stock
            </Button>
            {isLowStock(product) ? (
              <Button variant="ghost" size="sm" onClick={reorder}>
                <IconRefresh size={14} /> Reorder
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={toggleStore}>
              {product.online ? "● Online" : "○ Offline"}
            </Button>
          </Stack>
          <Box className="mb-3.5 grid items-center gap-[18px] rounded-md border border-line bg-paper p-3.5 shadow-sm md:grid-cols-[200px_minmax(0,1fr)_auto]">
            <Box className="w-[200px]" dangerouslySetInnerHTML={{ __html: barcodeSvg(code) }} />
            <Box className="min-w-0">
              <Text as="span" className="font-bold">
                {product.name}
              </Text>
              <MonoText className="mt-1 block tracking-[0.12em]">{code}</MonoText>
              <Text variant="caption" className="mt-0.5 text-[12px]">
                {catLabel(product.category)} · {product.manufacturer} · {product.pack}
              </Text>
            </Box>
            <Button variant="primary" size="sm" className="whitespace-nowrap" onClick={saveCode}>
              <IconDownload size={14} /> Save SVG
            </Button>
          </Box>
          <Box className="mb-3.5 grid grid-cols-2 overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
            <Kpi label="In stock" value={stockLabel(product)} small />
            <Kpi label="Stock value (cost)" value={inr(insight.costValue)} />
            <Kpi label="Retail value (MRP)" value={inr(insight.retailValue)} />
            <Kpi label="Margin" value={`${insight.margin}`} suffix="%" />
            <Kpi label="Sold · 30 days" value={String(insight.sold30)} suffix=" u" />
            <Kpi label="Sold · 90 days" value={String(insight.sold90)} suffix=" u" />
            <Kpi
              label="Days of cover"
              value={insight.coverDays === null ? "—" : String(insight.coverDays)}
              suffix={insight.coverDays !== null ? "d" : ""}
              alert={insight.coverDays !== null && insight.coverDays <= 14}
            />
            <Kpi label="Last sold" value={insight.lastSoldAt ? timeAgo(insight.lastSoldAt, now) : "never"} small />
          </Box>
          {low ? (
            <Pill tone="rose" className="mb-3">
              <IconAlert size={13} />{" "}
              {insight.stock === 0
                ? "Out of stock — reorder now"
                : `Low stock — ${insight.stock} left, reorder level ${product.reorderLevel}`}
            </Pill>
          ) : null}
          <Box className="mb-3.5 grid grid-cols-1 overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
            <Fact label="Manufacturer" value={product.manufacturer} />
            <Fact label="Pack" value={product.pack} />
            <Fact label="HSN / GST" value={`${product.hsn} · ${product.gst}%`} />
            <Box className="flex flex-col gap-0.5 bg-paper px-3 py-[9px]">
              <Text variant="label" className="text-[10.5px] tracking-[0.04em] text-faint uppercase">
                Rack location
              </Text>
              {hasLocation(product) ? (
                <MonoText size="sm">
                  <IconPin size={11} /> {locationCodes(product).join(" · ")}
                </MonoText>
              ) : (
                <Button
                  variant="ghost"
                  className="h-auto w-fit rounded-full border-0 bg-amber-bg px-[9px] py-[3px] text-[11px] font-bold text-gold-d"
                  onClick={assignRack}
                >
                  <IconAlert size={11} /> Unallocated · assign
                </Button>
              )}
            </Box>
            <Fact label="Reorder level" value={`${product.reorderLevel} units`} />
            <Fact label="Selling price" value={inr(sellPrice(product))} />
          </Box>
          <Box className="grid gap-4 md:grid-cols-2">
            <Box>
              <Text variant="label" className="mb-0.5 text-[11px] tracking-[0.08em] text-faint uppercase">
                Batches · stock & expiry
              </Text>
              <Box className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className={headCell}>Batch</TableHeaderCell>
                      <TableHeaderCell className={headCell}>Expiry</TableHeaderCell>
                      <TableHeaderCell align="right" className={headCell}>
                        Qty
                      </TableHeaderCell>
                      <TableHeaderCell align="right" className={headCell}>
                        MRP
                      </TableHeaderCell>
                      <TableHeaderCell align="right" className={headCell}>
                        Value
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {product.batches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className={bodyCell}>
                          <Text variant="muted" className="py-3.5 text-center text-[13px]">
                            No stock.
                          </Text>
                        </TableCell>
                      </TableRow>
                    ) : (
                      product.batches.map(renderBatch)
                    )}
                    {product.batches.length > 0 ? (
                      <TableRow className="bg-wash-2 font-extrabold">
                        <TableCell colSpan={2} className={`${bodyCell} bg-wash-2 font-extrabold`}>
                          Total
                        </TableCell>
                        <TableCell align="right" className={`${bodyCell} bg-wash-2 font-extrabold text-ink`}>
                          {insight.stock}
                        </TableCell>
                        <TableCell className={`${bodyCell} bg-wash-2`} />
                        <TableCell align="right" className={`${bodyCell} bg-wash-2 font-extrabold text-ink`}>
                          {inr(insight.costValue)}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </Box>
              {looseUnitsOf(product) > 0 ? (
                <Text variant="caption" className="mt-1.5 text-[11.5px]">
                  <IconUnlock size={12} /> {looseUnitsOf(product)} loose {unitNoun(product)}
                  {looseUnitsOf(product) !== 1 ? "s" : ""} from an opened strip.
                </Text>
              ) : null}
            </Box>
            <Box>
              <Text variant="label" className="mb-0.5 text-[11px] tracking-[0.08em] text-faint uppercase">
                Recent sales <Text as="span" className="text-[12px] font-medium tracking-normal text-muted normal-case">· movement</Text>
              </Text>
              <Box className="max-h-[250px] overflow-y-auto rounded-md border border-line bg-paper">
                {insight.movement.length === 0 ? (
                  <Text variant="muted" className="px-4 py-4 text-center text-[13px]">
                    No sales recorded.
                  </Text>
                ) : (
                  insight.movement.map(renderMove)
                )}
              </Box>
              <Text variant="caption" className="mt-2 text-[11px]">
                <IconLock size={11} /> Stock updates automatically from purchases & sales.
              </Text>
            </Box>
          </Box>
        </Box>
        <Stack direction="row" justify="end" gap={2} className="border-t border-line px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={receive}>
            <IconTruck size={15} /> Receive stock
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

function Kpi({
  label,
  value,
  suffix,
  small,
  alert,
}: {
  label: string;
  value: string;
  suffix?: string;
  small?: boolean;
  alert?: boolean;
}) {
  return (
    <Box className="flex flex-col gap-0.5 bg-paper px-3 py-2.5">
      <Text variant="label" className="text-[10.5px] tracking-[0.04em] text-faint uppercase">
        {label}
      </Text>
      <Text className={cn("font-display font-extrabold text-dark", small ? "text-[13px]" : "text-[17px]", alert && "text-rose")}>
        {value}
        {suffix ? <Text as="span" className="text-[11px] font-semibold text-muted">{suffix}</Text> : null}
      </Text>
    </Box>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex flex-col gap-0.5 bg-paper px-3 py-[9px]">
      <Text variant="label" className="text-[10.5px] tracking-[0.04em] text-faint uppercase">
        {label}
      </Text>
      <Text as="span" className="text-[13px] font-semibold text-ink">
        {value}
      </Text>
    </Box>
  );
}

function MovementRow({ move }: { move: ProductMovement }) {
  return (
    <Stack direction="row" align="center" gap={2} className="border-b border-line px-[13px] py-2 last:border-0">
      <Box className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-wash text-rose">−</Box>
      <Box className="min-w-0 flex-1">
        <MonoText size="sm" className="block truncate font-bold">
          {move.id}
        </MonoText>
        <Text variant="caption" className="text-[11px] whitespace-nowrap">
          {fmtDateTime(move.at).split(",")[0]} · {move.channel === "online" ? "Online" : "Counter"}
        </Text>
      </Box>
      <Text as="span" className="text-[13px] font-bold">
        {move.qty} u
      </Text>
    </Stack>
  );
}
