import { useState, type MouseEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { MonoText } from "@/components/atoms/MonoText";
import { Pill } from "@/components/atoms/Pill";
import { Stack } from "@/components/atoms/Stack";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/atoms";
import { Tag } from "@/components/atoms/Tag";
import { Text } from "@/components/atoms/Text";
import {
  IconArrowRight,
  IconBox,
  IconCash,
  IconPin,
  IconPrint,
  IconRx,
  IconShare,
  IconTruck,
  IconX,
} from "@/components/atoms/Icon";
import { Chip } from "@/components/molecules/Chip";
import { ChannelPill } from "@/components/molecules/ChannelPill";
import { StatusPill } from "@/components/molecules/StatusPill";
import { Invoice } from "@/components/organisms";
import { RxView } from "@/components/organisms";
import { fmtDateTime, inr, PAY_LABEL, STATUS_LABEL, timeAgo, type PayMode, type SaleItem } from "@/utils";
import { cn } from "@/utils/className";
import type { OrderTab } from "../../Orders.types";
import { orderHistory, rxStatusTone, type HistoryEntry } from "../../Orders.utils";
import { OrderTimeline } from "../OrderTimeline";
import type { OrderDetailProps } from "./OrderDetail.types";

const PAY_CHOICES: PayMode[] = ["cash", "upi", "card"];
const headCell =
  "bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase";
const bodyCell = "px-3.5 py-[11px] text-[13px] text-ink-2";

export function OrderDetail({
  sale,
  rx,
  profile,
  onClose,
  onAdvance,
  onCancel,
  onMarkPaid,
  onShare,
  onOpenRx,
  onPack,
  now,
  initialTab = "history",
}: OrderDetailProps) {
  const [tab, setTab] = useState<OrderTab>(initialTab);
  const [payMode, setPayMode] = useState<PayMode>(sale.payMode);
  const view = orderHistory(sale);
  const units = sale.items.reduce(function add(sum, item) {
    return sum + item.qty;
  }, 0);

  function showHistory() {
    setTab("history");
  }
  function showInvoice() {
    setTab("invoice");
  }
  function doPrint() {
    setTab("invoice");
    setTimeout(function printInvoice() {
      window.print();
    }, 80);
  }
  function keepOpen(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }
  function collect() {
    onMarkPaid(payMode);
  }
  function renderPay(mode: PayMode) {
    return <PayChoice key={mode} mode={mode} selected={payMode === mode} onSelect={setPayMode} />;
  }
  function renderItem(item: SaleItem) {
    return <ItemRow key={item.productId + item.batchNo} item={item} />;
  }
  const events = [...view.history, ...view.future];
  function renderEvent(entry: HistoryEntry, index: number) {
    return (
      <HistoryEvent key={`${entry.status}-${index}`} entry={entry} now={now} last={index === events.length - 1} />
    );
  }

  return (
    <Box
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={sale.id}
        className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={keepOpen}
      >
        <Stack direction="row" align="start" justify="between" className="border-b border-line px-5 py-4 print:hidden">
          <Box>
            <Heading level={3} className="text-[17px]">
              {sale.id}{" "}
              <Text as="span" className="text-[13px] font-semibold text-muted">
                · {sale.channel === "online" ? "Online order" : "Counter sale"}
              </Text>
            </Heading>
            <Stack direction="row" align="center" gap={1} className="mt-[5px]">
              <StatusPill status={sale.status} />
              <ChannelPill channel={sale.channel} />
              {sale.rx ? (
                <Tag tone="rx">
                  <IconRx size={11} /> Prescription
                </Tag>
              ) : null}
            </Stack>
          </Box>
          <IconButton label="Close" className="border-0 bg-wash-2" onClick={onClose}>
            <IconX size={18} />
          </IconButton>
        </Stack>
        <Box className="px-5 pt-3 print:hidden">
          <Box className="inline-flex gap-0.5 rounded-sm border border-line bg-wash-2 p-0.5">
            <TabButton label="Details & history" selected={tab === "history"} onClick={showHistory} />
            <TabButton label="Invoice" selected={tab === "invoice"} onClick={showInvoice} />
          </Box>
        </Box>
        <Box className="overflow-y-auto px-5 py-5">
          {tab === "history" ? (
            <>
              <Box className="mb-4 grid grid-cols-1 overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
                <Fact label="Order date & time" value={fmtDateTime(sale.createdAt)} small />
                <Fact label="Amount" value={inr(view.totals.payable)} />
                <Fact
                  label="Payment"
                  value={sale.paid === false ? "Unpaid · at reception" : PAY_LABEL[sale.payMode]}
                  small
                  alert={sale.paid === false}
                />
                <Fact
                  label="Customer"
                  value={`${sale.customer.name}${sale.customer.phone ? ` · ${sale.customer.phone}` : ""}`}
                  small
                />
                <Fact label="Items" value={`${units} units · ${sale.items.length} lines`} small />
                <Fact label="GST" value={`${inr(view.totals.totalTax)} (${inr(view.totals.taxable)} taxable)`} small />
              </Box>
              {sale.customer.address ? (
                <Text variant="muted" className="mb-3.5 text-[12.5px]">
                  <IconPin size={12} /> Deliver to: {sale.customer.address}
                </Text>
              ) : null}
              {sale.paid === false ? (
                <Box className="mb-4 rounded-md border border-[#f3d3d3] bg-rose-bg p-[18px]">
                  <Text className="text-[14px] font-extrabold text-rose">Payment pending · {inr(view.totals.payable)}</Text>
                  <Text variant="caption" className="mb-2.5 text-[12px]">
                    Sent to reception from billing. Collect & mark paid.
                  </Text>
                  <Stack direction="row" wrap gap={1} className="mb-2.5">
                    {PAY_CHOICES.map(renderPay)}
                  </Stack>
                  <Button variant="gold" block onClick={collect}>
                    <IconCash size={15} /> Mark as paid · {PAY_LABEL[payMode]}
                  </Button>
                </Box>
              ) : null}
              {sale.channel === "online" && sale.status !== "cancelled" ? <OrderTimeline status={sale.status} /> : null}
              <Text variant="label" className="text-[11px] tracking-[0.08em] text-faint uppercase">
                Status history
              </Text>
              <Box className="relative my-1 pl-[22px]">
                {events.map(renderEvent)}
              </Box>
              {sale.rx ? (
                <>
                  <Stack direction="row" align="center" justify="between" className="mt-4">
                    <Text variant="label" className="text-[11px] tracking-[0.08em] text-faint uppercase">
                      Prescription
                    </Text>
                    {rx ? (
                      <Stack direction="row" align="center" gap={1}>
                        <Pill tone={rxStatusTone(rx.status)} dot>
                          {rx.status}
                        </Pill>
                        <Button variant="ghost" size="sm" onClick={onOpenRx}>
                          Open <IconArrowRight size={13} />
                        </Button>
                      </Stack>
                    ) : null}
                  </Stack>
                  {rx ? (
                    <>
                      <Stack direction="row" align="center" gap={1} className="mb-2">
                        <MonoText size="sm" className="font-bold">
                          {rx.id}
                        </MonoText>
                        <Pill tone={rx.kind === "digital" ? "teal" : "gray"}>
                          {rx.kind === "digital" ? "Namma MedMate digital Rx" : "Uploaded photo"}
                        </Pill>
                      </Stack>
                      <RxView rx={rx} />
                    </>
                  ) : (
                    <Text variant="muted" className="text-[12.5px]">
                      Prescription-required items — Rx verified at billing (Dr. {sale.customer.doctor ?? "on file"}).
                    </Text>
                  )}
                </>
              ) : null}
              <Text variant="label" className="mt-4 text-[11px] tracking-[0.08em] text-faint uppercase">
                Items
              </Text>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className={headCell}>Item</TableHeaderCell>
                    <TableHeaderCell className={headCell}>Batch</TableHeaderCell>
                    <TableHeaderCell align="right" className={headCell}>
                      Qty
                    </TableHeaderCell>
                    <TableHeaderCell align="right" className={headCell}>
                      Rate
                    </TableHeaderCell>
                    <TableHeaderCell align="right" className={headCell}>
                      Amount
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.items.map(renderItem)}
                  <TableRow>
                    <TableCell colSpan={4} className={`${bodyCell} border-t-2 border-line-2 bg-wash-2 font-extrabold`}>
                      Total payable
                    </TableCell>
                    <TableCell align="right" className={`${bodyCell} border-t-2 border-line-2 bg-wash-2 font-extrabold text-ink`}>
                      {inr(view.totals.payable)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </>
          ) : (
            <Invoice sale={sale} profile={profile} className="print-area" />
          )}
        </Box>
        <Stack direction="row" justify="end" wrap gap={2} className="border-t border-line px-5 py-3.5 print:hidden">
          {sale.channel === "online" && sale.status === "new" ? (
            <Button variant="rose" onClick={onCancel}>
              Reject order
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="ghost" onClick={onShare}>
            <IconShare size={15} /> Share
          </Button>
          {sale.channel === "online" && sale.status === "new" ? (
            <Button variant="gold" onClick={onAdvance}>
              Accept order
            </Button>
          ) : null}
          {sale.channel === "online" && (sale.status === "accepted" || sale.status === "packed") && onPack ? (
            <Button variant="gold" onClick={onPack}>
              {sale.status === "accepted" ? (
                <>
                  <IconBox size={15} /> Pack & dispatch
                </>
              ) : (
                <>
                  <IconTruck size={15} /> Hand to delivery
                </>
              )}
            </Button>
          ) : null}
          {sale.channel === "online" && sale.status === "out" ? (
            <Button variant="gold" onClick={onAdvance}>
              Mark delivered
            </Button>
          ) : null}
          <Button variant="primary" onClick={doPrint}>
            <IconPrint size={16} /> Print / PDF
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

function TabButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-auto border-0 px-[13px] py-1.5 text-[12.5px] shadow-none",
        selected ? "bg-paper text-dark shadow-sm" : "bg-transparent text-muted",
      )}
    >
      {label}
    </Button>
  );
}

function PayChoice({
  mode,
  selected,
  onSelect,
}: {
  mode: PayMode;
  selected: boolean;
  onSelect: (mode: PayMode) => void;
}) {
  function select() {
    onSelect(mode);
  }
  return (
    <Chip selected={selected} className={cn(selected && "border-dark bg-dark text-white hover:bg-dark")} onClick={select}>
      {PAY_LABEL[mode]}
    </Chip>
  );
}

function Fact({ label, value, small, alert }: { label: string; value: string; small?: boolean; alert?: boolean }) {
  return (
    <Box className="bg-paper px-[13px] py-[11px]">
      <Text variant="caption" className="text-[11px] font-semibold">
        {label}
      </Text>
      <Text className={cn("mt-0.5 font-extrabold text-dark", small ? "font-sans text-[12.5px] font-bold" : "font-display text-[14px]", alert && "text-rose")}>
        {value}
      </Text>
    </Box>
  );
}

function HistoryEvent({ entry, now, last }: { entry: HistoryEntry; now: number; last: boolean }) {
  const future = Boolean(entry.future);
  const cancelled = entry.status === "cancelled";
  return (
    <Box className={cn("relative pl-3.5", last ? "pb-0" : "pb-4")}>
      <Box
        className={cn(
          "absolute top-0.5 -left-1 z-[1] h-3 w-3 rounded-full shadow-[0_0_0_3px_var(--color-wash)]",
          future && "bg-line-2 shadow-[0_0_0_3px_var(--color-canvas)]",
          cancelled && "bg-rose shadow-[0_0_0_3px_var(--color-rose-bg)]",
          !future && !cancelled && "bg-mid",
        )}
      />
      {last ? null : <Box className="absolute top-3 bottom-0 -left-px w-0.5 bg-line" />}
      <Text as="span" className={cn("text-[13px] font-bold text-ink", future && "font-semibold text-muted")}>
        {STATUS_LABEL[entry.status]}
      </Text>
      <Text variant="caption">
        {future ? "Pending" : `${fmtDateTime(entry.at)} · ${timeAgo(entry.at, now)}`}
      </Text>
    </Box>
  );
}

function ItemRow({ item }: { item: SaleItem }) {
  return (
    <TableRow>
      <TableCell className={`${bodyCell} font-semibold text-ink`}>{item.name}</TableCell>
      <TableCell className={`${bodyCell} font-mono`}>{item.batchNo}</TableCell>
      <TableCell align="right" className={`${bodyCell} font-semibold text-ink`}>
        {item.qty}
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-semibold text-ink`}>
        {inr(item.price)}
      </TableCell>
      <TableCell align="right" className={`${bodyCell} font-bold text-ink`}>
        {inr(item.price * item.qty)}
      </TableCell>
    </TableRow>
  );
}
