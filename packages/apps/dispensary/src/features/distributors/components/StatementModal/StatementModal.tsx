import { useState, type ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import {
  PAYMENT_MODES,
  inr,
  ledgerTotals,
  statementRows,
  type Distributor,
  type PaymentMode,
  type PaymentPayload,
} from "../../model";

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";

export function StatementModal({
  distributor,
  canPay,
  saving,
  error,
  onClose,
  onPay,
}: {
  distributor: Distributor;
  canPay: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onPay: (payment: PaymentPayload) => void;
}) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [note, setNote] = useState("");
  const totals = ledgerTotals(distributor);
  const rows = statementRows(distributor);
  const parsed = Number(amount);
  const payable =
    distributor.outstanding > 0 &&
    Number.isInteger(parsed) &&
    parsed >= 1 &&
    parsed <= distributor.outstanding;

  return (
    <Box
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={`${distributor.name} transactions`}
        className="flex max-h-[90vh] w-full max-w-[960px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="border-b border-line px-5 py-4"
        >
          <Box>
            <Heading level={3}>{distributor.name}</Heading>
            <Text className="mt-1 text-[12.5px] text-muted">{distributor.phone}</Text>
          </Box>
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            Close
          </Button>
        </Stack>
        <Box className="overflow-y-auto px-5 py-4">
          <Box className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-5">
            <Figure label="Opening" value={inr(totals.opening)} />
            <Figure label="Purchases" value={inr(totals.purchases)} />
            <Figure label="Payments" value={inr(totals.payments)} />
            <Figure label="Returns" value={inr(totals.returns)} />
            <Figure
              label="Outstanding"
              value={inr(distributor.outstanding)}
              owed={distributor.outstanding > 0}
            />
          </Box>
          <Box className="overflow-hidden rounded-md border border-line">
            <Box className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-[13px]">
                <thead>
                  <tr>
                    {["Date", "Type", "Reference", "Details", "Amount", "Balance"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-line">
                      <td className="border-t border-line px-3.5 py-3 text-muted">{row.when}</td>
                      <td className="border-t border-line px-3.5 py-3 font-semibold">{row.type}</td>
                      <td className="border-t border-line px-3.5 py-3 font-mono text-[12px]">
                        {row.reference}
                      </td>
                      <td className="border-t border-line px-3.5 py-3 text-muted">{row.details}</td>
                      <td className="border-t border-line px-3.5 py-3 font-bold">{row.amount}</td>
                      <td className="border-t border-line px-3.5 py-3 font-bold">{row.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Box>
          {canPay ? (
            <Box className="mt-4 border-t border-line pt-4">
              <Heading level={4} className="mb-3 text-[13px]">
                Record payment
              </Heading>
              <Box className="grid gap-3 md:grid-cols-3">
                <Input
                  aria-label="Amount"
                  type="number"
                  min={1}
                  placeholder="Amount (₹)"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
                <select
                  aria-label="Payment mode"
                  className={selectClass}
                  value={mode}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setMode(event.target.value as PaymentMode)
                  }
                >
                  {PAYMENT_MODES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <Input
                  aria-label="Note"
                  placeholder="Note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Box>
              {error ? (
                <Text className="mt-3 text-[12.5px] font-bold text-rose">{error}</Text>
              ) : null}
              <Stack direction="row" justify="end" className="mt-3">
                <Button
                  type="button"
                  disabled={!payable || saving}
                  onClick={() =>
                    onPay({
                      amount: parsed,
                      mode,
                      note: note.trim() ? note.trim() : null,
                    })
                  }
                >
                  Record payment
                </Button>
              </Stack>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

function Figure({ label, value, owed = false }: { label: string; value: string; owed?: boolean }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2">
      <Text className="text-[12.5px] text-muted">{label}</Text>
      <Text
        className={`mt-px block font-display text-[15px] font-bold ${owed ? "text-[#b4232a]" : "text-dark"}`}
      >
        {value}
      </Text>
    </Box>
  );
}
