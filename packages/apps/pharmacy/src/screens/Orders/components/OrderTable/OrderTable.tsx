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
import {
  IconBox,
  IconCash,
  IconClock,
  IconInbox,
  IconPrint,
  IconRx,
  IconShare,
  IconTruck,
} from "@/components/atoms/Icon";
import { ChannelPill } from "@/components/molecules/ChannelPill";
import { StatusPill } from "@/components/molecules/StatusPill";
import { inr, PAY_LABEL, timeAgo, type PayMode, type Sale } from "@/utils";
import { cn } from "@/utils/className";
import type { OrderTab } from "../../Orders.types";
import { orderPayable } from "../../Orders.utils";
import type { OrderTableProps } from "./OrderTable.types";

const headCell =
  "sticky top-0 z-[1] border-b border-line bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold tracking-[0.07em] whitespace-nowrap text-muted uppercase";
const numHead =
  "sticky top-0 z-[1] border-b border-line bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-semibold tracking-[0.07em] whitespace-nowrap text-ink uppercase";
const bodyCell = "border-b border-line px-3.5 py-[11px] align-middle text-[13px] text-ink-2";
const smBtn = "h-auto !leading-[1.5] active:translate-y-px";
const goldBtn = "border-[#10301d14] hover:bg-[#c99a3d] hover:brightness-100";
const roseBtn = "border-[#dc26262e] hover:bg-[#fbdada] hover:brightness-100";

export function OrderTable(props: OrderTableProps) {
  function renderSale(sale: Sale, index: number) {
    return (
      <OrderRow key={sale.id} sale={sale} last={index === props.sales.length - 1} {...props} />
    );
  }
  return (
    <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
      <Box className="overflow-x-auto">
        <Table className="border-separate border-spacing-0">
          <TableHead>
            <TableRow className="border-0">
              <TableHeaderCell className={headCell}>Invoice</TableHeaderCell>
              <TableHeaderCell className={headCell}>Customer</TableHeaderCell>
              <TableHeaderCell className={headCell}>Items</TableHeaderCell>
              <TableHeaderCell className={headCell}>Channel</TableHeaderCell>
              <TableHeaderCell className={headCell}>Payment</TableHeaderCell>
              <TableHeaderCell className={headCell}>Status</TableHeaderCell>
              <TableHeaderCell align="right" className={numHead}>
                Amount
              </TableHeaderCell>
              <TableHeaderCell className={headCell}>{""}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.sales.map(renderSale)}
            {props.sales.length === 0 ? (
              <TableRow className="border-0">
                <TableCell colSpan={8} className={`${bodyCell} border-b-0`}>
                  <Stack align="center" className="px-5 py-9 text-center">
                    <Box className="mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-[21px] leading-none text-mid">
                      <IconInbox size={28} />
                    </Box>
                    <Text variant="muted" className="mx-auto max-w-[340px]">
                      No orders in this view.
                    </Text>
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

function OrderRow({
  sale,
  last,
  now,
  onOpen,
  onMarkPaid,
  onAdvance,
  onCancel,
  onPack,
  onShare,
}: { sale: Sale; last: boolean } & Omit<OrderTableProps, "sales">) {
  const units = sale.items.reduce(function add(sum, item) {
    return sum + item.qty;
  }, 0);
  const names = sale.items
    .map(function name(item) {
      return item.name;
    })
    .join(", ");
  function open() {
    onOpen(sale, "history");
  }
  function history() {
    onOpen(sale, "history");
  }
  function invoice() {
    onOpen(sale, "invoice");
  }
  function share() {
    onShare(sale);
  }
  function paid() {
    onMarkPaid(sale.id, sale.payMode);
  }
  function advance() {
    onAdvance(sale.id);
  }
  function cancel() {
    onCancel(sale.id);
  }
  function pack() {
    onPack(sale.id);
  }
  function stop(event: MouseEvent) {
    event.stopPropagation();
  }
  const cell = cn(bodyCell, last && "border-b-0");
  return (
    <TableRow
      className="cursor-pointer border-0 transition-colors duration-100 hover:bg-wash-2"
      onClick={open}
    >
      <TableCell className={cn(cell, "font-mono font-bold")}>
        {sale.id}
        {sale.rx ? (
          <Tag tone="rx" className="ml-1.5 border-[#f3c7c7]">
            <IconRx size={11} /> Rx
          </Tag>
        ) : null}
      </TableCell>
      <TableCell className={cell}>
        <Text as="span" className="block text-[13px] leading-[1.5] font-semibold text-ink-2">
          {sale.customer.name}
        </Text>
        <Text variant="caption" className="block leading-[1.5]">
          {timeAgo(sale.createdAt, now)}
          {sale.customer.phone ? ` · ${sale.customer.phone}` : ""}
        </Text>
      </TableCell>
      <TableCell className={cell}>
        {units} units
        <Text variant="caption" className="block max-w-[200px] truncate leading-[1.5]">
          {names}
        </Text>
      </TableCell>
      <TableCell className={cell}>
        <ChannelPill channel={sale.channel} />
      </TableCell>
      <TableCell className={cell}>
        {sale.paid === false ? (
          <Pill tone="rose" dot className="gap-[5px]">
            Unpaid
          </Pill>
        ) : (
          PAY_LABEL[sale.payMode]
        )}
      </TableCell>
      <TableCell className={cell}>
        <StatusPill status={sale.status} className="gap-[5px]" />
      </TableCell>
      <TableCell align="right" className={cn(cell, "font-extrabold text-ink")}>
        {inr(orderPayable(sale))}
      </TableCell>
      <TableCell className={cell} onClick={stop}>
        <OrderActions
          sale={sale}
          onPaid={paid}
          onAdvance={advance}
          onCancel={cancel}
          onPack={pack}
          onHistory={history}
          onShare={share}
          onInvoice={invoice}
        />
      </TableCell>
    </TableRow>
  );
}

function OrderActions({
  sale,
  onPaid,
  onAdvance,
  onCancel,
  onPack,
  onHistory,
  onShare,
  onInvoice,
}: {
  sale: Sale;
  onPaid: () => void;
  onAdvance: () => void;
  onCancel: () => void;
  onPack: () => void;
  onHistory: () => void;
  onShare: () => void;
  onInvoice: () => void;
}) {
  const online = sale.channel === "online";
  return (
    <Stack direction="row" align="center" justify="end" className="gap-1.5">
      {sale.paid === false ? (
        <Button variant="gold" size="sm" className={cn(smBtn, goldBtn)} onClick={onPaid}>
          <IconCash size={14} /> Mark paid
        </Button>
      ) : null}
      {online && sale.status === "new" ? (
        <>
          <Button variant="primary" size="sm" className={smBtn} onClick={onAdvance}>
            Accept
          </Button>
          <Button variant="rose" size="sm" className={cn(smBtn, roseBtn)} onClick={onCancel}>
            Reject
          </Button>
        </>
      ) : null}
      {online && sale.status === "accepted" ? (
        <Button variant="primary" size="sm" className={smBtn} onClick={onPack}>
          <IconBox size={14} /> Pack order
        </Button>
      ) : null}
      {online && sale.status === "packed" ? (
        <Button variant="primary" size="sm" className={smBtn} onClick={onPack}>
          <IconTruck size={14} /> Hand to delivery
        </Button>
      ) : null}
      {online && sale.status === "out" ? (
        <Button variant="gold" size="sm" className={cn(smBtn, goldBtn)} onClick={onAdvance}>
          Mark delivered
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className={smBtn}
        title="View order history"
        onClick={onHistory}
      >
        <IconClock size={14} /> History
      </Button>
      <IconButton label="Share bill" title="Share bill" onClick={onShare}>
        <IconShare size={16} />
      </IconButton>
      <IconButton label="View and print invoice" title="View & print invoice" onClick={onInvoice}>
        <IconPrint size={16} />
      </IconButton>
    </Stack>
  );
}

export type { PayMode, OrderTab };
