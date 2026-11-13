import { useEffect, useState, type ReactNode } from "react";
import { problemMessage } from "@/features/authentication";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { IconPhone, IconWhatsApp, IconX } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import type { PatientDetail } from "../../model";
import { useRepayMutation } from "../../patients.api";
import { collectHref, rupee, visitDate } from "../../patientsView";

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";

const presets = [500, 1000, 2000];

export function CreditDialog({
  canUpdate,
  patient,
  onClose,
}: {
  canUpdate: boolean;
  patient: PatientDetail;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Box
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px] max-md:items-end max-md:p-0"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={`Credit for ${patient.name}`}
        className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop max-md:max-h-[92dvh] max-md:max-w-none max-md:rounded-t-2xl max-md:rounded-b-none"
        onClick={(event) => event.stopPropagation()}
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="shrink-0 border-b border-line px-5 py-4"
        >
          <Box>
            <Heading level={3} className="text-[17px]">
              {patient.name} · Khata
            </Heading>
            <Text as="span" className="mt-[3px] flex items-center gap-1.5 text-[12.5px] text-muted">
              <IconPhone size={11} />
              {patient.phone}
            </Text>
          </Box>
          <Button
            type="button"
            variant="ghost"
            aria-label="Dismiss"
            className="grid h-8 w-8 place-items-center rounded-sm border-0 bg-wash-2 p-0 text-ink-2 shadow-none hover:bg-wash"
            onClick={onClose}
          >
            <IconX size={18} />
          </Button>
        </Stack>
        <Box className="min-h-0 flex-1 overflow-y-auto p-5">
          <Credit patient={patient} canUpdate={canUpdate} />
        </Box>
        <Stack
          direction="row"
          justify="end"
          className="mt-auto shrink-0 gap-2.5 border-t border-line px-5 py-3.5"
        >
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

function Credit({ patient, canUpdate }: { patient: PatientDetail; canUpdate: boolean }) {
  const [repay, { error }] = useRepayMutation();
  const [amount, setAmount] = useState(patient.outstanding);
  const [mode, setMode] = useState("cash");
  const [note, setNote] = useState("");
  const outstanding = Number(patient.outstanding);
  const due = outstanding > 0;
  const half = (outstanding / 2).toFixed(2);
  const choices = presets.filter((value) => value < outstanding);

  async function collect() {
    const result = await repay({
      phone: patient.phone,
      body: { amount: Number(amount), mode, note },
    });
    if ("error" in result) return;
    setAmount("");
    setNote("");
  }

  return (
    <Stack gap={2}>
      <Box className="flex flex-wrap gap-2.5">
        <Summary label="Credit given" value={rupee(patient.given)} />
        <Summary label="Repaid" value={rupee(patient.repaid)} tone="green" />
        <Summary
          label="Outstanding"
          value={rupee(patient.outstanding)}
          tone={due ? "rose" : "green"}
        />
      </Box>
      <Box>
        <Button asChild variant="whatsapp">
          <a
            href={collectHref(patient.phone, patient.name, patient.outstanding)}
            target="_blank"
            rel="noreferrer"
          >
            <IconWhatsApp size={15} />
            Send reminder
          </a>
        </Button>
      </Box>
      {canUpdate && due ? (
        <Box className="rounded-md border border-line bg-wash-2 p-4">
          <Stack direction="row" gap={2} className="mb-2.5 flex-wrap">
            {choices.map((value) => (
              <AmountChip
                key={value}
                active={Number(amount) === value}
                onClick={() => setAmount(String(value))}
              >
                {rupee(String(value))}
              </AmountChip>
            ))}
            <AmountChip active={Number(amount) === Number(half)} onClick={() => setAmount(half)}>
              Half
            </AmountChip>
            <AmountChip
              active={Number(amount) === outstanding}
              onClick={() => setAmount(patient.outstanding)}
            >
              Full · {rupee(patient.outstanding)}
            </AmountChip>
          </Stack>
          <Box className="grid gap-3 sm:grid-cols-2">
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="repay-amount">Amount</Label>
              <Input
                id="repay-amount"
                aria-label="Repayment amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </Box>
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="repay-mode">Payment mode</Label>
              <select
                id="repay-mode"
                aria-label="Payment mode"
                className={selectClass}
                value={mode}
                onChange={(event) => setMode(event.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </Box>
            <Box className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="repay-note">Note</Label>
              <Box className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="repay-note"
                  aria-label="Note"
                  placeholder="Optional"
                  className="min-w-0 flex-1"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <Button
                  type="button"
                  className="shrink-0"
                  disabled={!(Number(amount) > 0)}
                  onClick={() => void collect()}
                >
                  Collect {rupee(amount)}
                </Button>
              </Box>
            </Box>
          </Box>
          {error ? (
            <Text role="alert" className="mt-3 text-[12.5px] font-bold text-rose">
              {problemMessage(error, "The repayment could not be saved")}
            </Text>
          ) : null}
        </Box>
      ) : null}
      <Box>
        <Text className="mb-1.5 text-[11px] font-extrabold tracking-[0.08em] text-faint uppercase">
          Account ledger{" "}
          <Text
            as="span"
            className="text-[12px] font-medium tracking-normal text-muted normal-case"
          >
            · {patient.ledger.length}
          </Text>
        </Text>
        <Box className="max-h-[260px] overflow-y-auto rounded-md border border-line bg-paper shadow-sm">
          {patient.ledger.length === 0 ? (
            <Text className="px-4 py-6 text-center text-muted">No activity.</Text>
          ) : (
            patient.ledger.map((line) => <LedgerRow key={`${line.kind}-${line.ref}`} line={line} />)
          )}
        </Box>
      </Box>
    </Stack>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "rose" | "green";
}) {
  return (
    <Box className="min-w-[140px] flex-1 rounded-[10px] border border-line bg-paper px-3.5 py-2">
      <Text className="text-[12.5px] text-muted">{label}</Text>
      <Text
        className={cn(
          "mt-px block text-[15px] font-bold text-dark",
          tone === "rose" && "text-rose",
          tone === "green" && "text-green",
        )}
      >
        {value}
      </Text>
    </Box>
  );
}

function AmountChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "primary" : "ghost"}
      className="h-auto rounded-full px-3.5 py-[7px] text-[12.5px] shadow-none"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function LedgerRow({ line }: { line: PatientDetail["ledger"][number] }) {
  const debit = line.kind === "debit";
  return (
    <Box className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0">
      <Text
        as="span"
        className={cn(
          "grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-wash text-[16px] font-bold",
          debit ? "text-rose" : "text-green",
        )}
      >
        {debit ? "−" : "+"}
      </Text>
      <Box className="min-w-0 flex-1">
        <Text className="text-[13.5px] font-bold text-ink">{line.label}</Text>
        <Text className="font-mono text-xs text-muted">
          {line.ref} · {visitDate(line.at)}
        </Text>
      </Box>
      <Text className={cn("text-[13px] font-bold", debit ? "text-rose" : "text-green")}>
        {debit ? "−" : "+"}
        {rupee(line.amount)}
      </Text>
    </Box>
  );
}
