import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { usePharma } from "@/hooks";
import { inr, timeAgo, totalCreditOutstanding, customerCredit } from "@/utils";
import {
  Box,
  Button,
  Input,
  Pill,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  Text,
} from "@/components/atoms";
import {
  IconCart,
  IconDownload,
  IconGlobe,
  IconPrint,
  IconReceipt,
  IconRefresh,
  IconRx,
  IconSearch,
  IconStore,
  IconUser,
  IconUsers,
} from "@/components/atoms";
import {
  aggregateCustomers,
  buildCustomerDirectory,
  exportCustomersCsv,
  exportCustomersPdf,
  filterCustomers,
  loyaltyPoints,
  sortCustomers,
  summarizeCustomers,
} from "./Customers.utils";
import type { CustomerAccount, CustomerSort } from "./Customers.types";
import { CustomerModal } from "./components/CustomerModal";

export default function CustomersScreen() {
  const { sales, creditPayments, recordCreditPayment, now, go, profile } = usePharma();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CustomerSort>("spent");
  const [open, setOpen] = useState<CustomerAccount | null>(null);
  const exportRows = useMemo(function exportRowsOf() {
    return aggregateCustomers(sales);
  }, [sales]);
  const customers = useMemo(function directoryOf() {
    return buildCustomerDirectory(sales);
  }, [sales]);
  const list = sortCustomers(filterCustomers(customers, query), sort);
  const summary = summarizeCustomers(customers);
  const creditDue = totalCreditOutstanding(sales, creditPayments);

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function showSpenders() {
    setSort("spent");
  }

  function showOrders() {
    setSort("orders");
  }

  function showRecent() {
    setSort("recent");
  }

  function handleExcel() {
    exportCustomersCsv(exportRows, now);
  }

  function handlePdf() {
    exportCustomersPdf(exportRows, profile, now);
  }

  function handleClose() {
    setOpen(null);
  }

  function handleNewSale() {
    setOpen(null);
    go("pos");
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-4">
        <StatCard tone="green" icon={<IconUser size={18} />} label="Customers" value={String(summary.named)} hint="+ walk-ins" />
        <StatCard tone="blue" icon={<IconCart size={18} />} label="Lifetime sales" value={inr(summary.totalSpent)} hint="across all customers" />
        <StatCard tone="gold" icon={<IconRefresh size={18} />} label="Repeat customers" value={String(summary.repeat)} hint="ordered more than once" />
        <StatCard tone="rose" icon={<IconRx size={18} />} label="On chronic Rx" value={String(summary.chronic)} hint="long-term therapy" />
        <StatCard tone="gold" icon={<IconReceipt size={18} />} label="Credit outstanding" value={inr(creditDue)} hint="khata / udhaar" />
      </Box>

      <Stack direction="row" align="center" wrap className="mb-4 gap-2.5">
        <Stack direction="row" align="center" gap={2} className="min-w-[240px] max-w-[360px] flex-1 rounded-sm border border-line-2 bg-paper px-3 py-2">
          <Box className="text-green">
            <IconSearch size={17} />
          </Box>
          <Input variant="plain" aria-label="Search customers" placeholder="Search customer name or phone…" value={query} onChange={handleQueryChange} className="py-0 placeholder:text-faint" />
        </Stack>
        <Box className="flex-1" />
        <Stack direction="row" className="gap-0.5 rounded-sm border border-line bg-wash-2 p-0.5">
          <SortButton label="Top spenders" selected={sort === "spent"} onSelect={showSpenders} />
          <SortButton label="Most orders" selected={sort === "orders"} onSelect={showOrders} />
          <SortButton label="Recent" selected={sort === "recent"} onSelect={showRecent} />
        </Stack>
        <Button variant="ghost" disabled={!exportRows.length} title="Download customer database as Excel (CSV)" onClick={handleExcel}>
          <IconDownload size={14} /> Excel
        </Button>
        <Button variant="ghost" disabled={!exportRows.length} title="Download customer database as PDF" onClick={handlePdf}>
          <IconPrint size={15} /> PDF
        </Button>
      </Stack>

      <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
        <Box className="overflow-x-auto">
          <Table className="border-separate border-spacing-0 text-[13px]">
            <TableHead>
              <TableRow className="border-0">
                <HeaderCell>Customer</HeaderCell>
                <HeaderCell>Phone</HeaderCell>
                <HeaderCell align="right">Orders</HeaderCell>
                <HeaderCell>Channel</HeaderCell>
                <HeaderCell align="right">Units</HeaderCell>
                <HeaderCell>Last visit</HeaderCell>
                <HeaderCell align="right">Loyalty</HeaderCell>
                <HeaderCell align="right">Lifetime value</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <CustomerRows customers={list} sales={sales} creditPayments={creditPayments} now={now} onOpen={setOpen} />
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Stack align="center" className="px-5 py-9 text-center text-muted">
                      <Box className="mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-mid">
                        <IconUsers size={30} />
                      </Box>
                      <Text variant="muted">No customers match.</Text>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {open ? (
        <CustomerModal
          customer={open}
          onClose={handleClose}
          onNewSale={handleNewSale}
          sales={sales}
          creditPayments={creditPayments}
          recordCreditPayment={recordCreditPayment}
          profile={profile}
        />
      ) : null}
    </Box>
  );
}

function HeaderCell({ children, align }: { children: string; align?: "right" }) {
  return (
    <TableHeaderCell align={align} className="sticky top-0 z-[1] whitespace-nowrap border-b border-line bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted">
      {children}
    </TableHeaderCell>
  );
}

function SortButton({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <Button variant="ghost" onClick={onSelect} className={selected ? "border-0 bg-paper px-[13px] py-1.5 text-[12.5px] text-dark shadow-sm" : "border-0 bg-transparent px-[13px] py-1.5 text-[12.5px] text-muted shadow-none"}>
      {label}
    </Button>
  );
}

function CustomerRows({
  customers,
  sales,
  creditPayments,
  now,
  onOpen,
}: {
  customers: CustomerAccount[];
  sales: Parameters<typeof customerCredit>[1];
  creditPayments: Parameters<typeof customerCredit>[2];
  now: number;
  onOpen: (customer: CustomerAccount) => void;
}) {
  return customers.map(function renderCustomer(customer) {
    return (
      <CustomerRow key={customer.key} customer={customer} sales={sales} creditPayments={creditPayments} now={now} onOpen={onOpen} />
    );
  });
}

function CustomerRow({
  customer,
  sales,
  creditPayments,
  now,
  onOpen,
}: {
  customer: CustomerAccount;
  sales: Parameters<typeof customerCredit>[1];
  creditPayments: Parameters<typeof customerCredit>[2];
  now: number;
  onOpen: (customer: CustomerAccount) => void;
}) {
  const due = customer.key === "walkin" ? 0 : customerCredit(customer.key, sales, creditPayments).outstanding;

  function handleOpen() {
    onOpen(customer);
  }

  return (
    <TableRow className="cursor-pointer hover:bg-wash-2" onClick={handleOpen}>
      <TableCell className="px-3.5 py-[11px]">
        <Stack direction="row" align="center" gap={2}>
          <Box className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-wash text-mid">
            <IconUser size={15} />
          </Box>
          <Text as="span" className="font-bold text-ink">
            {customer.name}
            {customer.rx ? <Tag tone="rx" className="ml-1.5">Rx</Tag> : null}
            {due > 0 ? <Pill tone="rose" className="ml-1.5">Due {inr(due)}</Pill> : null}
          </Text>
        </Stack>
      </TableCell>
      <TableCell className="px-3.5 py-[11px] font-mono">{customer.phone}</TableCell>
      <TableCell align="right" className="px-3.5 py-[11px] font-bold">{customer.orders.length}</TableCell>
      <TableCell className="px-3.5 py-[11px]">
        <Stack direction="row" align="center" className="gap-[14px] text-[12px] text-ink-2 tabular-nums" title={`${customer.online} online · ${customer.offline} counter`}>
          <Stack direction="row" align="center" className="gap-[5px]">
            <Box className="text-faint"><IconGlobe size={13} /></Box>
            {customer.online}
          </Stack>
          <Stack direction="row" align="center" className="gap-[5px]">
            <Box className="text-faint"><IconStore size={13} /></Box>
            {customer.offline}
          </Stack>
        </Stack>
      </TableCell>
      <TableCell align="right" className="px-3.5 py-[11px] font-semibold text-ink">{customer.units}</TableCell>
      <TableCell className="px-3.5 py-[11px]">{timeAgo(customer.last, now)}</TableCell>
      <TableCell align="right" className="px-3.5 py-[11px]">
        <Pill tone="gold">{loyaltyPoints(customer.spent)} pts</Pill>
      </TableCell>
      <TableCell align="right" className="px-3.5 py-[11px] font-extrabold">{inr(customer.spent)}</TableCell>
    </TableRow>
  );
}

function StatCard({ tone, icon, label, value, hint }: { tone: "green" | "blue" | "gold" | "rose"; icon: ReactNode; label: string; value: string; hint: string }) {
  const toneClass = { green: "bg-wash text-mid", blue: "bg-blue-bg text-blue", gold: "bg-amber-bg text-gold-d", rose: "bg-rose-bg text-rose" }[tone];
  return (
    <Stack className="rounded-md border border-line bg-paper px-[18px] py-4 shadow-sm">
      <Box className={`grid h-8 w-8 place-items-center rounded-[9px] ${toneClass}`}>{icon}</Box>
      <Text variant="label" className="mt-3 text-[11px] font-bold uppercase tracking-[0.05em] text-muted">{label}</Text>
      <Text className="mb-2.5 mt-[3px] font-display text-[26px] font-extrabold tracking-[-0.03em] text-dark tabular-nums">{value}</Text>
      <Text variant="caption" className="mt-auto border-t border-line pt-[9px] text-[12px]">{hint}</Text>
    </Stack>
  );
}
