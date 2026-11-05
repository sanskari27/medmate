import type { MouseEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { MonoText } from "@/components/atoms/MonoText";
import { Pill } from "@/components/atoms/Pill";
import { Stack } from "@/components/atoms/Stack";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/atoms";
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
import { Thumb } from "@/components/molecules";
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

const modalMotion = `
@keyframes inventoryFade { from { opacity: 0 } }
@keyframes inventoryPop { from { transform: translateY(14px) scale(.98); opacity: .6 } }
.inventory-fade { animation: inventoryFade .16s ease }
.inventory-pop { animation: inventoryPop .2s cubic-bezier(.2,.9,.3,1.2) }
`;

const headCell =
  "sticky top-0 z-[1] border-b border-line bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold tracking-[0.07em] whitespace-nowrap text-muted uppercase";
const bodyCell = "border-b border-line px-3.5 py-[11px] align-middle text-[13px] text-ink-2";
const footCell =
  "border-t-2 border-line-2 bg-wash-2 px-3.5 py-[11px] text-[13px] font-extrabold text-ink-2";
const goldPill =
  "inline-flex cursor-pointer items-center gap-[5px] rounded-full border-0 bg-amber-bg px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap text-gold-d";
const sectionLabel = "mb-0.5 text-[11px] font-extrabold tracking-[0.08em] text-faint uppercase";

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
        <TableCell className={`${bodyCell} font-mono font-bold text-ink`}>
          {batch.batchNo || "—"}
        </TableCell>
        <TableCell className={bodyCell}>
          <Pill tone={expiryTone(expired, months)}>
            {batch.expiry}
            {expired ? " · exp" : months <= 4 ? ` · ${months}mo` : ""}
          </Pill>
        </TableCell>
        <TableCell align="right" className={`${bodyCell} font-bold`}>
          {batch.qty}
        </TableCell>
        <TableCell align="right" className={`${bodyCell} font-semibold`}>
          {inr(batch.mrp)}
        </TableCell>
        <TableCell align="right" className={`${bodyCell} font-semibold`}>
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
      className="inventory-fade fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px] max-[767px]:items-end max-[767px]:p-0"
      onClick={onClose}
    >
      <style>{modalMotion}</style>
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="inventory-pop flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop max-[767px]:max-h-[92dvh] max-[767px]:max-w-none max-[767px]:rounded-t-2xl max-[767px]:rounded-b-none"
        onClick={keepOpen}
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          gap={3}
          className="border-b border-line px-5 py-4"
        >
          <Stack direction="row" align="center" gap={3} className="min-w-0">
            <Box className="grid h-[42px] w-[42px] shrink-0 place-items-center overflow-hidden rounded-[11px] bg-wash font-display leading-none font-[750] tracking-[-0.02em] text-mid">
              <Thumb
                p={product}
                className="font-display leading-none font-[750] tracking-[-0.02em]"
              />
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
          <IconButton
            label="Close"
            className="h-8 w-8 rounded-sm border-0 bg-wash-2 text-ink-2 hover:bg-wash hover:text-ink-2"
            onClick={onClose}
          >
            <IconX size={18} />
          </IconButton>
        </Stack>
        <Box className="overflow-y-auto px-5 py-5">
          <Stack direction="row" wrap className="mb-3.5 gap-[6px]">
            <Button variant="primary" size="sm" className="active:translate-y-px" onClick={onEdit}>
              <IconEdit size={14} /> Edit product
            </Button>
            <Button variant="ghost" size="sm" className="active:translate-y-px" onClick={receive}>
              <IconTruck size={14} /> Receive stock
            </Button>
            {isLowStock(product) ? (
              <Button variant="ghost" size="sm" className="active:translate-y-px" onClick={reorder}>
                <IconRefresh size={14} /> Reorder
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="active:translate-y-px"
              onClick={toggleStore}
            >
              {product.online ? "● Online" : "○ Offline"}
            </Button>
          </Stack>
          <Box className="mb-3.5 grid grid-cols-[200px_minmax(0,1fr)_auto] items-center gap-[18px] rounded-md border border-line bg-paper p-3.5 shadow-sm">
            <Box className="w-[200px]" dangerouslySetInnerHTML={{ __html: barcodeSvg(code) }} />
            <Box className="min-w-0">
              <Text as="span" className="font-bold">
                {product.name}
              </Text>
              <MonoText className="mt-1 block text-[14px] tracking-[0.12em]">{code}</MonoText>
              <Text variant="caption" className="mt-0.5 text-[12px]">
                {catLabel(product.category)} · {product.manufacturer} · {product.pack}
              </Text>
            </Box>
            <Button
              variant="primary"
              size="sm"
              className="whitespace-nowrap active:translate-y-px"
              onClick={saveCode}
            >
              <IconDownload size={14} /> Save SVG
            </Button>
          </Box>
          <Box className="mb-3.5 grid grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line max-[767px]:grid-cols-2">
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
            <Kpi
              label="Last sold"
              value={insight.lastSoldAt ? timeAgo(insight.lastSoldAt, now) : "never"}
              small
            />
          </Box>
          {low ? (
            <Pill tone="rose" className="mb-3 gap-[5px]">
              <IconAlert size={13} />{" "}
              {insight.stock === 0
                ? "Out of stock — reorder now"
                : `Low stock — ${insight.stock} left, reorder level ${product.reorderLevel}`}
            </Pill>
          ) : null}
          <Box className="mb-3.5 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line max-[767px]:grid-cols-2">
            <Fact label="Manufacturer" value={product.manufacturer} />
            <Fact label="Pack" value={product.pack} />
            <Fact label="HSN / GST" value={`${product.hsn} · ${product.gst}%`} />
            <Box className="flex flex-col gap-0.5 bg-paper px-3 py-[9px]">
              <Text
                variant="label"
                className="text-[10.5px] tracking-[0.04em] text-faint uppercase"
              >
                Rack location
              </Text>
              {hasLocation(product) ? (
                <MonoText className="text-[13px] font-semibold">
                  <IconPin size={11} /> {locationCodes(product).join(" · ")}
                </MonoText>
              ) : (
                <button type="button" className={`${goldPill} w-fit`} onClick={assignRack}>
                  <IconAlert size={11} /> Unallocated · assign
                </button>
              )}
            </Box>
            <Fact label="Reorder level" value={`${product.reorderLevel} units`} />
            <Fact label="Selling price" value={inr(sellPrice(product))} />
          </Box>
          <Box className="grid grid-cols-[1.5fr_1fr] gap-4 max-[767px]:grid-cols-1">
            <Box>
              <Text variant="label" className={sectionLabel}>
                Batches · stock & expiry
              </Text>
              <Box className="overflow-x-auto">
                <Table className="border-separate border-spacing-0 [&_tbody_tr]:border-0 [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-100 [&_tbody_tr:hover]:bg-wash-2 [&_tbody:last-child_tr:last-child_td]:border-b-0 [&_tfoot_td]:border-t-2 [&_tfoot_td]:border-b-0 [&_tfoot_td]:border-line-2 [&_tfoot_td]:bg-wash-2 [&_tfoot_td]:font-extrabold">
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
                          <Text variant="muted" className="px-3.5 py-3.5 text-center text-[13px]">
                            No stock.
                          </Text>
                        </TableCell>
                      </TableRow>
                    ) : (
                      product.batches.map(renderBatch)
                    )}
                  </TableBody>
                  {product.batches.length > 0 ? (
                    <tfoot>
                      <tr className="bg-wash-2 font-extrabold">
                        <td colSpan={2} className={footCell}>
                          Total
                        </td>
                        <td className={cn(footCell, "text-right tabular-nums")}>{insight.stock}</td>
                        <td className={cn(footCell, "text-right tabular-nums")} />
                        <td className={cn(footCell, "text-right tabular-nums")}>
                          {inr(insight.costValue)}
                        </td>
                      </tr>
                    </tfoot>
                  ) : null}
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
              <Text variant="label" className={sectionLabel}>
                Recent sales{" "}
                <Text as="span" className="text-[12px] font-medium text-muted">
                  · movement
                </Text>
              </Text>
              <Box className="max-h-[250px] overflow-x-hidden overflow-y-auto rounded-md border border-line bg-paper shadow-sm">
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
        <Stack
          direction="row"
          justify="end"
          className="gap-[10px] border-t border-line px-5 py-3.5 max-[767px]:flex-wrap max-[767px]:[&_button]:flex-1"
        >
          <Button variant="ghost" className="active:translate-y-px" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" className="active:translate-y-px" onClick={receive}>
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
      <Text
        className={cn(
          "font-display font-extrabold text-dark",
          small ? "text-[13px]" : "text-[17px]",
          alert && "text-rose",
        )}
      >
        {value}
        {suffix ? (
          <Text as="span" className="text-[11px] font-semibold text-muted">
            {suffix}
          </Text>
        ) : null}
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
    <Stack
      direction="row"
      align="center"
      className="gap-[10px] border-b border-line px-[13px] py-2 last:border-0"
    >
      <Box className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-wash font-display leading-none font-[750] text-rose">
        −
      </Box>
      <Box className="min-w-0 flex-1">
        <MonoText className="block truncate text-[12.5px] font-bold">{move.id}</MonoText>
        <Text variant="caption" className="truncate text-[11px] whitespace-nowrap">
          {fmtDateTime(move.at).split(",")[0]} · {move.channel === "online" ? "Online" : "Counter"}
        </Text>
      </Box>
      <Text as="span" className="text-[13px] font-bold">
        {move.qty} u
      </Text>
    </Stack>
  );
}
