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
import { Tag } from "@/components/atoms/Tag";
import { Text } from "@/components/atoms/Text";
import { IconCash, IconClock, IconPrint, IconReceipt, IconShare } from "@/components/atoms/Icon";
import { ChannelPill } from "@/components/molecules/ChannelPill";
import { StatusPill } from "@/components/molecules/StatusPill";
import { fmtDateTime, inr, PAY_LABEL, timeAgo, type PayMode, type Sale } from "@/utils";
import { cn } from "@/utils/className";
import type { SalesSortKey } from "../../Sales.types";
import { sortMarker, unitCount, type SalesRow } from "../../Sales.utils";
import type { SalesTableProps } from "./SalesTable.types";

const headCell =
  "sticky top-0 z-[1] whitespace-nowrap border-b border-line bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase";
const bodyCell = "border-b border-line px-3.5 py-[11px] align-middle text-[13px] text-ink-2";
const footCell =
  "border-t-2 border-b-0 border-line-2 bg-wash-2 px-3.5 py-[11px] align-middle text-[13px] font-extrabold text-ink-2";
const numHead = "text-right font-semibold tabular-nums text-ink";

export function SalesTable(props: SalesTableProps) {
  function renderRow(row: SalesRow) {
    return (
      <SalesRecord
        key={row.sale.id}
        row={row}
        now={props.now}
        onOpen={props.onOpen}
        onMarkPaid={props.onMarkPaid}
        onShare={props.onShare}
      />
    );
  }
  return (
    <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
      <Box className="overflow-x-auto">
        <Table className="border-separate border-spacing-0 [&_tr:last-child_td]:border-b-0">
          <TableHead>
            <TableRow className="border-b-0">
              <TableHeaderCell className={headCell}>Invoice</TableHeaderCell>
              <SortHeader label="Date / time" sortKey="date" {...props} />
              <SortHeader label="Customer" sortKey="customer" {...props} />
              <TableHeaderCell className={headCell}>Channel</TableHeaderCell>
              <SortHeader label="Units" sortKey="items" align="right" {...props} />
              <TableHeaderCell className={headCell}>Payment</TableHeaderCell>
              <TableHeaderCell className={headCell}>Status</TableHeaderCell>
              <TableHeaderCell align="right" className={cn(headCell, numHead)}>
                GST
              </TableHeaderCell>
              <SortHeader label="Total" sortKey="total" align="right" {...props} />
              <TableHeaderCell className={headCell}>{""}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.rows.map(renderRow)}
            {props.rows.length === 0 ? (
              <TableRow className="border-b-0">
                <TableCell colSpan={10} className={bodyCell}>
                  <Stack align="center" className="px-5 py-9 text-center text-muted">
                    <Box className="mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-mid">
                      <IconReceipt size={30} />
                    </Box>
                    <Text variant="muted" className="!mx-auto !my-0 max-w-[340px]">
                      No sales in this period / filter.
                    </Text>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
          {props.rows.length > 0 ? (
            <tfoot>
              <TableRow className="border-b-0">
                <TableCell colSpan={7} className={footCell}>
                  Total · {props.rows.length} bills · {props.units} units
                </TableCell>
                <TableCell align="right" className={cn(footCell, "text-ink")}>
                  {props.tax}
                </TableCell>
                <TableCell align="right" className={cn(footCell, "text-ink")}>
                  {props.net}
                </TableCell>
                <TableCell className={footCell} />
              </TableRow>
            </tfoot>
          ) : null}
        </Table>
      </Box>
    </Box>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  direction,
  onSort,
  align,
}: {
  label: string;
  sortKey: SalesSortKey;
  align?: "right";
} & Pick<SalesTableProps, "sort" | "direction" | "onSort">) {
  function sortBy() {
    onSort(sortKey);
  }
  const active = sort === sortKey;
  return (
    <TableHeaderCell
      align={align}
      className={cn(
        headCell,
        "cursor-pointer select-none hover:text-mid",
        align === "right" && numHead,
        active && "text-mid",
      )}
      onClick={sortBy}
    >
      {label}
      <Text as="span" className="ml-[3px] text-[9px] text-current opacity-90">
        {sortMarker(active, direction)}
      </Text>
    </TableHeaderCell>
  );
}

function SalesRecord({
  row,
  now,
  onOpen,
  onMarkPaid,
  onShare,
}: {
  row: SalesRow;
  now: number;
  onOpen: (sale: Sale, tab: "history" | "invoice") => void;
  onMarkPaid: (id: string, payMode: PayMode) => void;
  onShare: (sale: Sale) => void;
}) {
  const { sale, totals } = row;
  function openHistory() {
    onOpen(sale, "history");
  }
  function openInvoice() {
    onOpen(sale, "invoice");
  }
  function share() {
    onShare(sale);
  }
  function markPaid() {
    onMarkPaid(sale.id, sale.payMode);
  }
  function stop(event: MouseEvent) {
    event.stopPropagation();
  }
  return (
    <TableRow
      className="cursor-pointer border-b-0 transition-colors duration-100 hover:bg-wash-2"
      onClick={openHistory}
    >
      <TableCell className={`${bodyCell} font-mono font-bold`}>
        {sale.id}
        {sale.rx ? (
          <Tag tone="rx" className="ml-[5px] border-[#f3c7c7]">
            Rx
          </Tag>
        ) : null}
      </TableCell>
      <TableCell className={`${bodyCell} whitespace-nowrap`}>
        {fmtDateTime(sale.createdAt)}
        <Text variant="caption" className="text-[11px] leading-[1.5]">
          {timeAgo(sale.createdAt, now)}
        </Text>
      </TableCell>
      <TableCell className={bodyCell}>
        {sale.customer.name}
        {sale.customer.phone ? (
          <Text variant="caption" className="leading-[1.5]">
            {sale.customer.phone}
          </Text>
        ) : null}
      </TableCell>
      <TableCell className={bodyCell}>
        <ChannelPill channel={sale.channel} />
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-semibold text-ink`}>
        {unitCount(sale)}
      </TableCell>
      <TableCell className={bodyCell}>
        {sale.paid === false ? (
          <Pill tone="rose" dot className="gap-[5px]">
            Unpaid
          </Pill>
        ) : (
          PAY_LABEL[sale.payMode]
        )}
      </TableCell>
      <TableCell className={bodyCell}>
        <StatusPill status={sale.status} className="gap-[5px]" />
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-semibold text-ink`}>
        {inr(totals.totalTax)}
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-extrabold text-ink`}>
        {inr(totals.payable)}
      </TableCell>
      <TableCell className={bodyCell} onClick={stop}>
        <Stack direction="row" justify="end" className="gap-1.5">
          {sale.paid === false ? (
            <Button
              variant="gold"
              size="sm"
              className="border-[#10301d14] !leading-[1.5] hover:border-[#10301d14] hover:bg-[#c99a3d] hover:brightness-100 active:translate-y-px"
              onClick={markPaid}
            >
              <IconCash size={13} /> Paid
            </Button>
          ) : null}
          <IconButton label="History" title="History" onClick={openHistory}>
            <IconClock size={15} />
          </IconButton>
          <IconButton label="Share" title="Share" onClick={share}>
            <IconShare size={15} />
          </IconButton>
          <IconButton label="Invoice" title="Invoice" onClick={openInvoice}>
            <IconPrint size={15} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
