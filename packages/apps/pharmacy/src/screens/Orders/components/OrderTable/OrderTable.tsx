import type { MouseEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { IconButton } from "@/components/atoms/IconButton";
import { Pill } from "@/components/atoms/Pill";
import { Stack } from "@/components/atoms/Stack";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/atoms";
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
import type { OrderTab } from "../../Orders.types";
import { orderPayable } from "../../Orders.utils";
import type { OrderTableProps } from "./OrderTable.types";

const headCell =
  "sticky top-0 z-[1] bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase";
const bodyCell = "px-3.5 py-[11px] align-middle text-[13px] text-ink-2";

export function OrderTable(props: OrderTableProps) {
  function renderSale(sale: Sale) {
    return <OrderRow key={sale.id} sale={sale} {...props} />;
  }
  return (
    <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
      <Box className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className={headCell}>Invoice</TableHeaderCell>
              <TableHeaderCell className={headCell}>Customer</TableHeaderCell>
              <TableHeaderCell className={headCell}>Items</TableHeaderCell>
              <TableHeaderCell className={headCell}>Channel</TableHeaderCell>
              <TableHeaderCell className={headCell}>Payment</TableHeaderCell>
              <TableHeaderCell className={headCell}>Status</TableHeaderCell>
              <TableHeaderCell align="right" className={headCell}>
                Amount
              </TableHeaderCell>
              <TableHeaderCell className={headCell}>{""}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.sales.map(renderSale)}
            {props.sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className={bodyCell}>
                  <Stack align="center" className="px-5 py-9 text-center">
                    <Box className="mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-mid">
                      <IconInbox size={28} />
                    </Box>
                    <Text variant="muted">No orders in this view.</Text>
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
  now,
  onOpen,
  onMarkPaid,
  onAdvance,
  onCancel,
  onPack,
  onShare,
}: { sale: Sale } & Omit<OrderTableProps, "sales">) {
  const units = sale.items.reduce(function add(sum, item) {
    return sum + item.qty;
  }, 0);
  const names = sale.items.map(function name(item) {
    return item.name;
  }).join(", ");
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
  return (
    <TableRow className="cursor-pointer hover:bg-wash-2" onClick={open}>
      <TableCell className={`${bodyCell} font-mono font-bold text-ink`}>
        {sale.id}
        {sale.rx ? (
          <Tag tone="rx" className="ml-1.5">
            <IconRx size={11} /> Rx
          </Tag>
        ) : null}
      </TableCell>
      <TableCell className={bodyCell}>
        <Text as="span" className="font-semibold text-ink">
          {sale.customer.name}
        </Text>
        <Text variant="caption">
          {timeAgo(sale.createdAt, now)}
          {sale.customer.phone ? ` · ${sale.customer.phone}` : ""}
        </Text>
      </TableCell>
      <TableCell className={bodyCell}>
        {units} units
        <Text variant="caption" className="max-w-[200px] truncate">
          {names}
        </Text>
      </TableCell>
      <TableCell className={bodyCell}>
        <ChannelPill channel={sale.channel} />
      </TableCell>
      <TableCell className={bodyCell}>
        {sale.paid === false ? (
          <Pill tone="rose" dot>
            Unpaid
          </Pill>
        ) : (
          PAY_LABEL[sale.payMode]
        )}
      </TableCell>
      <TableCell className={bodyCell}>
        <StatusPill status={sale.status} />
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-extrabold text-ink`}>
        {inr(orderPayable(sale))}
      </TableCell>
      <TableCell className={bodyCell} onClick={stop}>
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
    <Stack direction="row" justify="end" wrap gap={1}>
      {sale.paid === false ? (
        <Button variant="gold" size="sm" onClick={onPaid}>
          <IconCash size={14} /> Mark paid
        </Button>
      ) : null}
      {online && sale.status === "new" ? (
        <>
          <Button variant="primary" size="sm" onClick={onAdvance}>
            Accept
          </Button>
          <Button variant="rose" size="sm" onClick={onCancel}>
            Reject
          </Button>
        </>
      ) : null}
      {online && sale.status === "accepted" ? (
        <Button variant="primary" size="sm" onClick={onPack}>
          <IconBox size={14} /> Pack order
        </Button>
      ) : null}
      {online && sale.status === "packed" ? (
        <Button variant="primary" size="sm" onClick={onPack}>
          <IconTruck size={14} /> Hand to delivery
        </Button>
      ) : null}
      {online && sale.status === "out" ? (
        <Button variant="gold" size="sm" onClick={onAdvance}>
          Mark delivered
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" title="View order history" onClick={onHistory}>
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
