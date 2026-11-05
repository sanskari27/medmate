import { useState, type ChangeEvent } from "react";
import { PAY_LABEL, SETTLED_MODES, computeInvoice, customerCredit, customerLedger, fmtDateTime, inr, smsLink, waLink, type LedgerRow, type PayMode, type Sale } from "@/utils";
import { Box, Button, Input, Select, Stack, Text } from "@/components/atoms";
import { IconCheck, IconGlobe, IconMessage, IconStore, IconWhatsApp } from "@/components/atoms";
import { Modal } from "@/components/molecules/Modal";
import { creditOutreach, ordersNewestFirst, repaymentAmount } from "@/screens/Customers/Customers.utils";
import type { CustomerModalProps } from "@/screens/Customers/Customers.types";

export function CustomerModal({ customer, onClose, onNewSale, sales, creditPayments, recordCreditPayment, profile }: CustomerModalProps) {
  const isWalkIn = customer.key === "walkin";
  const credit = isWalkIn ? { given: 0, repaid: 0, outstanding: 0 } : customerCredit(customer.key, sales, creditPayments);
  const ledger = isWalkIn ? [] : customerLedger(customer.key, sales, creditPayments);
  const phone = customer.phone && customer.phone !== "—" ? customer.phone : "";
  const [repay, setRepay] = useState(false);
  const [amount, setAmount] = useState(credit.outstanding);
  const [mode, setMode] = useState<PayMode>("cash");

  function openMessage(kind: "remind" | "invite", channel: "wa" | "sms") {
    if (!phone) return;
    const text = creditOutreach(kind, customer.name, profile.name, credit.outstanding);
    const href = channel === "wa" ? waLink(phone, text) : smsLink(phone, text);
    window.open(href, "_blank");
  }

  function handleRemindWhatsApp() {
    openMessage(credit.outstanding > 0 ? "remind" : "invite", "wa");
  }

  function handleRemindSms() {
    openMessage(credit.outstanding > 0 ? "remind" : "invite", "sms");
  }

  function handleStartRepay() {
    setAmount(credit.outstanding);
    setRepay(true);
  }

  function handleCancelRepay() {
    setRepay(false);
  }

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    setAmount(Number(event.target.value) || 0);
  }

  function handleModeChange(event: ChangeEvent<HTMLSelectElement>) {
    setMode(event.target.value as PayMode);
  }

  async function handleRepay() {
    if (amount <= 0) return;
    const error = await recordCreditPayment({
      custKey: customer.key,
      custName: customer.name,
      custPhone: phone,
      amount: repaymentAmount(amount, credit.outstanding),
      mode,
    });
    if (!error) setRepay(false);
  }

  const settled = SETTLED_MODES.filter(function withoutCod(payMode) {
    return payMode !== "cod";
  });

  return (
    <Modal
      title={customer.name}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={onNewSale}>New sale</Button>
        </>
      }
    >
      <Box className="max-h-[60vh] overflow-y-auto">
        <Stack direction="row" wrap gap={2} className="mb-3.5">
          <SummaryChip label="Phone" value={customer.phone} />
          <SummaryChip label="Lifetime" value={inr(customer.spent)} />
          <SummaryChip label="Orders" value={String(customer.orders.length)} />
          <SummaryChip label="Credit due" value={inr(credit.outstanding)} emphasis={credit.outstanding > 0 ? "rose" : undefined} />
        </Stack>
        {isWalkIn ? null : (
          <>
            <SectionLabel>Credit account (khata)</SectionLabel>
            <Stack direction="row" align="center" wrap gap={2} className="mb-2.5">
              <Text variant="muted" className="flex-1 text-[13px]">
                Given {inr(credit.given)} · Repaid {inr(credit.repaid)} ·{" "}
                <Text as="span" className={credit.outstanding > 0 ? "font-bold text-rose" : "font-bold text-green"}>
                  Outstanding {inr(credit.outstanding)}
                </Text>
              </Text>
              {credit.outstanding > 0 && !repay ? (
                <Button variant="primary" onClick={handleStartRepay}>
                  <IconCheck size={15} /> Record repayment
                </Button>
              ) : null}
              <Button variant="ghost" disabled={!phone} onClick={handleRemindWhatsApp}>
                <IconWhatsApp size={15} /> {credit.outstanding > 0 ? "Remind" : "Offer credit"}
              </Button>
              <Button variant="ghost" disabled={!phone} onClick={handleRemindSms}>
                <IconMessage size={15} /> SMS
              </Button>
            </Stack>
            {repay ? (
              <Stack direction="row" align="center" wrap gap={2} className="mb-3">
                <Input data-field="amount" type="number" min={0} value={amount || ""} onChange={handleAmountChange} placeholder="Amount ₹" className="w-[120px]" autoFocus aria-label="Repayment amount" />
                <Select className="w-[110px]" value={mode} onChange={handleModeChange} aria-label="Payment mode" options={[...PayModeOptions({modes: settled})]} />
                <Button variant="primary" disabled={amount <= 0} onClick={handleRepay}>
                  Save ₹{Math.round(repaymentAmount(amount, credit.outstanding)).toLocaleString("en-IN")}
                </Button>
                <Button variant="ghost" onClick={handleCancelRepay}>Cancel</Button>
              </Stack>
            ) : null}
            <LedgerRows rows={ledger} />
          </>
        )}
        <SectionLabel>Purchase history</SectionLabel>
        <PurchaseRows orders={ordersNewestFirst(customer.orders)} />
      </Box>
    </Modal>
  );
}

function SummaryChip({ label, value, emphasis }: { label: string; value: string; emphasis?: "rose" }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2 text-[12.5px] text-muted">
      {label}
      <Text className={emphasis === "rose" ? "mt-px block font-display text-[15px] font-extrabold text-rose" : "mt-px block font-display text-[15px] font-extrabold text-dark"}>{value}</Text>
    </Box>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text variant="label" className="mt-4 mb-0.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-faint first:mt-0">{children}</Text>;
}

function PayModeOptions({ modes }: { modes: PayMode[] }) {
  return modes.map(renderPayMode);
}

function renderPayMode(mode: PayMode) {
  return { value: String(mode), label: String(PAY_LABEL[mode]) };
}

function LedgerRows({ rows }: { rows: LedgerRow[] }) {
  return rows.map(function renderLedger(row, index) {
    return <LedgerLine key={`${row.ref}-${index}`} row={row} />;
  });
}

function LedgerLine({ row }: { row: LedgerRow }) {
  const debit = row.kind === "debit";
  return (
    <Stack direction="row" align="center" gap={3} className="border-b border-line py-3 last:border-0">
      <Box className={debit ? "grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-wash text-rose" : "grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-wash text-green"}>
        {debit ? "−" : "+"}
      </Box>
      <Stack gap={0} className="min-w-0 flex-1">
        <Text as="span" className="text-[13.5px] font-bold text-ink">{row.label}</Text>
        <Text variant="caption">{row.ref}</Text>
      </Stack>
      <Stack align="end" gap={0}>
        <Text as="span" className={debit ? "text-[12px] font-bold text-rose" : "text-[12px] font-bold text-green"}>
          {debit ? "−" : "+"}
          {inr(row.amount)}
        </Text>
        <Text variant="caption">{fmtDateTime(row.at)}</Text>
      </Stack>
    </Stack>
  );
}

function PurchaseRows({ orders }: { orders: Sale[] }) {
  return orders.map(function renderOrder(sale) {
    return <PurchaseLine key={sale.id} sale={sale} />;
  });
}

function PurchaseLine({ sale }: { sale: Sale }) {
  const totals = computeInvoice(sale.items, sale.discount);
  const names = sale.items.map(function itemName(item) {
    return item.name;
  }).join(", ");
  return (
    <Stack direction="row" align="center" gap={3} className="border-b border-line py-3 last:border-0">
      <Box className="grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-wash text-mid">
        {sale.channel === "online" ? <IconGlobe size={15} /> : <IconStore size={15} />}
      </Box>
      <Stack gap={0} className="min-w-0 flex-1">
        <Text as="span" className="text-[13.5px] font-bold text-ink">{sale.id} · {inr(totals.payable)}</Text>
        <Text variant="caption">{names}</Text>
      </Stack>
      <Stack gap={0} className="text-right text-[11.5px]">
        <Text variant="caption">{fmtDateTime(sale.createdAt)}</Text>
        <Text variant="caption">{PAY_LABEL[sale.payMode]}</Text>
      </Stack>
    </Stack>
  );
}
