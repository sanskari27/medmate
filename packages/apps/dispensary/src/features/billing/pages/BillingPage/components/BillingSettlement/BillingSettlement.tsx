import type { ReactNode } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import type { DiscountKind } from "../../../../model";
import { rupee, type BillTotals } from "../../billingView";
import { smallCell } from "../BillingCart";

export function BillingSettlement({
  patientName,
  patientPhone,
  prescribedBy,
  prescriptionNumber,
  needsRx,
  discountType,
  discountValue,
  cashReceived,
  totals,
  change,
  balance,
  chargeAllowed,
  ready,
  charging,
  error,
  onPatient,
  onPrescription,
  onDiscountType,
  onDiscountValue,
  onCash,
  onCharge,
}: {
  patientName: string;
  patientPhone: string;
  prescribedBy: string;
  prescriptionNumber: string;
  needsRx: boolean;
  discountType: DiscountKind;
  discountValue: number;
  cashReceived: string;
  totals: BillTotals;
  change: number;
  balance: number;
  chargeAllowed: boolean;
  ready: boolean;
  charging: boolean;
  error: string | null;
  onPatient: (name: string, phone: string) => void;
  onPrescription: (doctor: string, number: string) => void;
  onDiscountType: (type: DiscountKind) => void;
  onDiscountValue: (value: number) => void;
  onCash: (value: string) => void;
  onCharge: () => void;
}) {
  return (
    <Box className="shrink-0 rounded-md border border-line bg-paper p-2 shadow-sm">
      <Box className="grid items-start gap-3 lg:grid-cols-12">
        <Box className="grid gap-1.5 border-line sm:grid-cols-2 lg:col-span-4 lg:border-r lg:pr-3">
          <Text
            as="span"
            className="sm:col-span-2 text-[10px] font-bold tracking-wide text-faint uppercase"
          >
            Customer
          </Text>
          <Field id="patient-phone" label="Phone">
            <input
              id="patient-phone"
              inputMode="numeric"
              value={patientPhone}
              placeholder="10 digits"
              onChange={(event) =>
                onPatient(patientName, event.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className={smallCell}
            />
          </Field>
          <Field id="patient-name" label="Patient name">
            <input
              id="patient-name"
              value={patientName}
              placeholder="Walk-in customer"
              onChange={(event) => onPatient(event.target.value, patientPhone)}
              className={smallCell}
            />
          </Field>
          <Text as="span" className="text-[10px] text-muted sm:col-span-2">
            {patientPhone.length}/10 digits
            {patientName.trim() ? ` · ${patientName.trim()}` : " · Name required"}
          </Text>
          {needsRx ? (
            <>
              <Field id="prescribed-by" label="Prescribed by">
                <input
                  id="prescribed-by"
                  value={prescribedBy}
                  onChange={(event) => onPrescription(event.target.value, prescriptionNumber)}
                  className={smallCell}
                />
              </Field>
              <Field id="prescription-number" label="Prescription number">
                <input
                  id="prescription-number"
                  value={prescriptionNumber}
                  onChange={(event) => onPrescription(prescribedBy, event.target.value)}
                  className={smallCell}
                />
              </Field>
            </>
          ) : (
            <Text as="span" className="text-[10px] text-faint sm:col-span-2">
              No prescription on this bill
            </Text>
          )}
        </Box>

        <Box className="grid content-start gap-1.5 border-line lg:col-span-4 lg:border-r lg:pr-3">
          <Text as="span" className="text-[10px] font-bold tracking-wide text-faint uppercase">
            Settlement
          </Text>
          <Stack direction="row" gap={1} className="rounded-sm bg-canvas p-0.5">
            <PayOption label="Cash" checked />
            <PayOption label="UPI" />
            <PayOption label="Card" />
          </Stack>
          <Text as="span" className="text-[10px] text-muted">
            Cash is collected at the counter. UPI and card are not taken on this bill.
          </Text>
          <Box className="grid grid-cols-2 gap-1.5">
            <Field id="bill-extra" label="Bill discount">
              <select
                id="bill-extra"
                aria-label="Extra discount"
                value={discountType}
                onChange={(event) => onDiscountType(event.target.value as DiscountKind)}
                className={smallCell}
              >
                <option value="none">None</option>
                <option value="percent">Percent off the bill</option>
                <option value="flat">Rupees off the bill</option>
              </select>
            </Field>
            {discountType === "none" ? (
              <Readout label="Bill discount" value={rupee(0)} />
            ) : (
              <Field
                id="bill-extra-value"
                label={discountType === "percent" ? "Percent" : "Rupees"}
              >
                <input
                  id="bill-extra-value"
                  inputMode="decimal"
                  value={discountValue}
                  onChange={(event) => onDiscountValue(Number(event.target.value))}
                  className={smallCell}
                />
              </Field>
            )}
            <Field id="cash-received" label="Cash received">
              <input
                id="cash-received"
                inputMode="decimal"
                value={cashReceived}
                placeholder="0.00"
                onChange={(event) => onCash(event.target.value.replace(/[^\d.]/g, ""))}
                className={smallCell}
              />
            </Field>
            <Readout label="Change to return" value={rupee(change)} strong />
            <Readout label="Balance due" value={rupee(balance)} />
            <Readout label="Pay mode" value="Cash" />
          </Box>
        </Box>

        <Box className="rounded-sm bg-canvas px-2.5 py-1.5 lg:col-span-4">
          <Box className="mb-1 flex items-center justify-between">
            <Text as="span" className="text-[10px] font-bold tracking-wide text-faint uppercase">
              Bill summary
            </Text>
            <Text as="span" className="font-mono text-[10px] text-muted tabular-nums">
              {totals.lines} items · {totals.units} units
            </Text>
          </Box>
          <Box className="grid grid-cols-2 gap-x-3">
            <Money label="Gross MRP" value={totals.subtotal} />
            <Money label="Offer discount" value={totals.offers} signed />
            <Money label="Row special" value={totals.lineExtra} signed />
            <Money label="Bill discount" value={totals.billOff} signed />
            <Money label="Total discount" value={totals.savings} signed />
            <Money label="Taxable value" value={totals.taxable} muted />
            <Money label="CGST" value={totals.cgst} muted />
            <Money label="SGST" value={totals.sgst} muted />
            <Money label="GST included" value={totals.gst} muted />
            <Money label="You save" value={totals.savings} signed />
          </Box>
          <Box className="mt-1 flex items-end justify-between gap-2 border-t border-line pt-1">
            <Box>
              <Text as="span" className="block text-[10px] font-bold tracking-wide uppercase">
                Amount payable
              </Text>
              <Text as="span" className="font-mono text-[18px] leading-none font-extrabold">
                {rupee(totals.payable)}
              </Text>
            </Box>
            {chargeAllowed ? (
              <Button
                type="button"
                variant="primary"
                aria-label="Charge"
                disabled={!ready || charging}
                className="h-auto min-w-[96px] flex-col px-3 py-2 text-[13px]"
                onClick={onCharge}
              >
                Charge
                <Text as="span" aria-hidden className="text-[10px] font-medium text-mint">
                  Ctrl+Enter
                </Text>
              </Button>
            ) : null}
          </Box>
        </Box>
      </Box>
      {error ? (
        <Text variant="caption" className="mt-1 text-rose" role="alert">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

function Money({
  label,
  value,
  signed,
  muted,
}: {
  label: string;
  value: number;
  signed?: boolean;
  muted?: boolean;
}) {
  const text = signed && value > 0 ? `-${rupee(value)}` : rupee(value);
  return (
    <Box className="flex justify-between gap-2">
      <Text as="span" className={`text-[11px] ${muted ? "text-faint" : "text-muted"}`}>
        {label}
      </Text>
      <Text
        as="span"
        className={`font-mono text-[11px] ${signed && value > 0 ? "text-dark" : "text-ink"}`}
      >
        {text}
      </Text>
    </Box>
  );
}

function Readout({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Box className="grid gap-0.5">
      <Text as="span" className="text-[10px] font-bold tracking-wide text-faint uppercase">
        {label}
      </Text>
      <Text
        as="span"
        className={`flex h-6 items-center font-mono text-[11px] tabular-nums ${strong ? "font-bold text-dark" : "text-ink"}`}
      >
        {value}
      </Text>
    </Box>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <label htmlFor={id} className="grid gap-0.5">
      <Text as="span" className="text-[10px] font-bold tracking-wide text-faint uppercase">
        {label}
      </Text>
      {children}
    </label>
  );
}

function PayOption({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <label
      className={`flex-1 cursor-pointer rounded-xs px-2 py-1 text-center text-[12px] font-semibold ${checked ? "bg-dark text-white" : "text-faint"}`}
    >
      <input
        type="radio"
        name="pay"
        value={label.toLowerCase()}
        checked={checked === true}
        disabled={checked !== true}
        onChange={() => undefined}
        className="sr-only"
      />
      {label}
    </label>
  );
}
