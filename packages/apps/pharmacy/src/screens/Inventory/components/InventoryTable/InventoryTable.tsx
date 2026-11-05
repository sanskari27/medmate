import type { MouseEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { IconButton } from "@/components/atoms/IconButton";
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
import { IconAlert, IconBox, IconEdit, IconPin, IconTruck } from "@/components/atoms/Icon";
import { ScheduleTag } from "@/components/molecules/ScheduleTag";
import { StockPill } from "@/components/molecules/StockPill";
import { Thumb } from "@/components/molecules";
import { Switch } from "@/components/atoms/Switch";
import {
  catLabel,
  earliestBatch,
  hasLocation,
  inr,
  inr2,
  isExpired,
  isLooseEligible,
  locationCodes,
  monthsToExpiry,
  mrpOf,
  perUnitPrice,
  stockValue,
  unitNoun,
  type InvProduct,
} from "@/utils";
import { expiryTone } from "../../Inventory.utils";
import type { InventoryTableProps } from "./InventoryTable.types";

const headCell =
  "sticky top-0 z-[1] border-b border-line bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase";
const bodyCell = "px-3.5 py-[11px] align-middle text-[13px] text-ink-2";

export function InventoryTable({
  products,
  catalogueEmpty,
  now,
  onOpen,
  onEdit,
  onToggleLoose,
  onToggleOnline,
  onGo,
}: InventoryTableProps) {
  function renderProduct(product: InvProduct) {
    return (
      <InventoryRow
        key={product.id}
        product={product}
        now={now}
        onOpen={onOpen}
        onEdit={onEdit}
        onToggleLoose={onToggleLoose}
        onToggleOnline={onToggleOnline}
        onGo={onGo}
      />
    );
  }
  function addStock() {
    onGo("purchases");
  }
  return (
    <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
      <Box className="overflow-x-auto">
        <Table className="border-separate border-spacing-0">
          <TableHead>
            <TableRow>
              <TableHeaderCell className={headCell}>Product</TableHeaderCell>
              <TableHeaderCell className={headCell}>Category</TableHeaderCell>
              <TableHeaderCell className={headCell}>Schedule</TableHeaderCell>
              <TableHeaderCell className={headCell}>Rack</TableHeaderCell>
              <TableHeaderCell align="right" className={headCell}>
                Batches
              </TableHeaderCell>
              <TableHeaderCell className={headCell}>Expiry</TableHeaderCell>
              <TableHeaderCell className={headCell}>Stock</TableHeaderCell>
              <TableHeaderCell align="right" className={headCell}>
                MRP
              </TableHeaderCell>
              <TableHeaderCell align="right" className={headCell}>
                Value
              </TableHeaderCell>
              <TableHeaderCell className={headCell}>Loose / Online</TableHeaderCell>
              <TableHeaderCell className={headCell}>{""}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map(renderProduct)}
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className={bodyCell}>
                  <Stack align="center" className="px-5 py-9 text-center">
                    <Box className="mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-mid">
                      <IconBox size={28} />
                    </Box>
                    <Text variant="muted" className="max-w-[340px] text-[13px]">
                      {catalogueEmpty
                        ? "No products yet — add stock by entering a distributor purchase bill."
                        : "No products match this filter."}
                    </Text>
                    {catalogueEmpty ? (
                      <Button variant="primary" size="sm" className="mt-2.5" onClick={addStock}>
                        <IconTruck size={14} /> New purchase entry
                      </Button>
                    ) : null}
                  </Stack>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}

function InventoryRow({
  product,
  now,
  onOpen,
  onEdit,
  onToggleLoose,
  onToggleOnline,
  onGo,
}: {
  product: InvProduct;
  now: number;
} & Omit<InventoryTableProps, "products" | "catalogueEmpty">) {
  const batch = earliestBatch(product);
  const months = batch ? monthsToExpiry(batch.expiry, now) : 99;
  const expired = batch ? isExpired(batch.expiry, now) : false;
  function open() {
    onOpen(product);
  }
  function stop(event: MouseEvent) {
    event.stopPropagation();
  }
  function edit() {
    onEdit(product);
  }
  function toggleLoose() {
    onToggleLoose(product.id);
  }
  function toggleOnline() {
    onToggleOnline(product.id);
  }
  function openRacks() {
    onGo("rackmap");
  }
  const looseOn = product.looseAllowed ?? true;
  return (
    <TableRow className="cursor-pointer hover:bg-wash-2" onClick={open}>
      <TableCell className={bodyCell}>
        <Stack direction="row" align="center" gap={2}>
          <Box className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-wash text-[17px]">
            <Thumb p={product} />
          </Box>
          <Box>
            <Text as="span" className="font-bold text-ink">
              {product.name}
            </Text>
            <Text variant="caption">
              {product.composition} · {product.manufacturer}
            </Text>
          </Box>
        </Stack>
      </TableCell>
      <TableCell className={`${bodyCell} whitespace-nowrap`}>{catLabel(product.category)}</TableCell>
      <TableCell className={bodyCell}>
        <ScheduleTag schedule={product.schedule} />
      </TableCell>
      <TableCell className={bodyCell} onClick={stop}>
        {hasLocation(product) ? (
          <Text
            as="span"
            className="inline-flex items-center gap-0.5 rounded-[5px] bg-wash px-[5px] py-px font-mono text-[10px] font-bold whitespace-nowrap text-mid"
          >
            <IconPin size={11} /> {locationCodes(product).join(" · ")}
          </Text>
        ) : (
          <Button
            variant="ghost"
            className="h-auto rounded-full border-0 bg-amber-bg px-[9px] py-[3px] text-[11px] font-bold text-gold-d"
            title="Not assigned to a rack — click to allocate"
            onClick={openRacks}
          >
            <IconAlert size={11} /> Unallocated
          </Button>
        )}
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-semibold text-ink`}>
        {product.batches.length}
      </TableCell>
      <TableCell className={bodyCell}>
        {batch ? (
          <Pill tone={expiryTone(expired, months)}>{expired ? "Expired" : batch.expiry}</Pill>
        ) : null}
      </TableCell>
      <TableCell className={bodyCell}>
        <StockPill p={product} now={now} />
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-bold text-ink`}>
        {inr(mrpOf(product))}
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-semibold text-ink`}>
        {inr(stockValue(product))}
      </TableCell>
      <TableCell className={bodyCell} onClick={stop}>
        <Stack direction="row" align="center" gap={1}>
          {isLooseEligible(product) ? (
            <>
              <Switch checked={looseOn} label="Toggle loose selling" onClick={toggleLoose} />
              {looseOn ? (
                <Text variant="caption" className="text-[11px]">
                  {inr2(perUnitPrice(product))}/{unitNoun(product)}
                </Text>
              ) : null}
            </>
          ) : (
            <Text variant="caption" className="text-[12px]">
              —
            </Text>
          )}
          <Switch checked={product.online} label="Toggle online" onClick={toggleOnline} />
        </Stack>
      </TableCell>
      <TableCell className={bodyCell} onClick={stop}>
        <Stack direction="row" justify="end">
          <IconButton label="Edit" title="Edit" onClick={edit}>
            <IconEdit size={15} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
