import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import {
  PAY_LABEL,
  PAY_MODES,
  daysIn,
  formatWhen,
  freeBeds,
  inr,
  moneyDue,
  type Admission,
  type PayMode,
  type Ward,
} from "../model";
import { WardDialog } from "./WardDialog";

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";
const chip =
  "inline-flex h-auto items-center gap-[7px] rounded-full border border-line-2 bg-paper px-3.5 py-[7px] text-[12.5px] font-bold text-ink-2 shadow-none hover:border-[#b9d0c2] hover:bg-wash-2";

export function AdmissionModal({
  admission,
  wards,
  admissions,
  now,
  canTransfer,
  canDischarge,
  error,
  onClose,
  onTransfer,
  onDischarge,
}: {
  admission: Admission;
  wards: Ward[];
  admissions: Admission[];
  now: number;
  canTransfer: boolean;
  canDischarge: boolean;
  error: string | null;
  onClose: () => void;
  onTransfer: (wardId: string, bed: string) => void;
  onDischarge: (payMode: PayMode | null) => void;
}) {
  const [mode, setMode] = useState<PayMode>(
    admission.payerType === "insurance" ? "insurance" : "cash",
  );
  const [wardId, setWardId] = useState(admission.wardId);
  const ward = wards.find((item) => item.id === wardId);
  const [bed, setBed] = useState(ward ? (freeBeds(ward, admissions)[0] ?? "") : "");
  const due = moneyDue(admission.outstanding);
  const days = daysIn(admission.admittedAt, now);

  function pickWard(id: string) {
    setWardId(id);
    const next = wards.find((item) => item.id === id);
    const nextBeds = next ? freeBeds(next, admissions) : [];
    setBed(nextBeds[0] ?? "");
  }

  return (
    <WardDialog
      title={
        <>
          {admission.name}{" "}
          <Text as="span" className="text-[13px] font-semibold text-muted">
            · {admission.bed}
          </Text>
        </>
      }
      subtitle={`${admission.uhid} · ${admission.wardName} · admitted ${days}d ago (${formatWhen(admission.admittedAt)})`}
      error={error}
      onClose={onClose}
    >
      <Box className="grid grid-cols-2 gap-3 text-[12.5px] text-muted">
        <Fact label="Attending" value={admission.doctor || "—"} />
        <Fact label="Diagnosis" value={admission.diagnosis || "—"} />
        <Fact
          label="Payer"
          value={
            admission.payerType === "insurance" ? admission.insurer || "Insurance" : "Self-pay"
          }
        />
        <Fact
          label={admission.payerType === "insurance" ? "Policy no." : "Phone"}
          value={
            admission.payerType === "insurance" ? admission.policyNo || "—" : admission.phone || "—"
          }
          mono
        />
      </Box>
      <Box className="my-4 flex flex-wrap gap-2.5">
        <Stat label="Days" value={String(admission.days)} />
        <Stat label="Daily rate" value={inr(admission.dailyRate)} />
        <Stat label="Ward charge" value={inr(admission.outstanding)} />
        <Stat label="Outstanding" value={inr(admission.outstanding)} />
      </Box>
      {canTransfer ? (
        <Box className="rounded-md border border-line bg-wash-2 p-[18px] shadow-sm">
          <Text as="span" className="mb-2.5 block font-bold">
            Transfer
          </Text>
          <Box className="grid grid-cols-2 gap-3 max-[767px]:grid-cols-1">
            <select
              aria-label="Transfer ward"
              className={selectClass}
              value={wardId}
              onChange={(event) => pickWard(event.target.value)}
            >
              {wards.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({freeBeds(item, admissions).length} free)
                </option>
              ))}
            </select>
            <select
              aria-label="Transfer bed"
              className={selectClass}
              value={bed}
              onChange={(event) => setBed(event.target.value)}
            >
              {(ward ? freeBeds(ward, admissions) : []).map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </Box>
          <Button
            type="button"
            className="mt-3"
            disabled={!bed}
            onClick={() => onTransfer(wardId, bed)}
          >
            Transfer to {bed || "bed"}
          </Button>
        </Box>
      ) : null}
      {canDischarge ? (
        <Box className="mt-4 rounded-md border border-line bg-wash-2 p-[18px] shadow-sm">
          <Box className={cn("flex items-center justify-between", due ? "mb-2.5" : "mb-0")}>
            <Text as="span" className="font-bold">
              Final bill & discharge
            </Text>
            <Text
              as="span"
              className={cn("font-display font-extrabold", due ? "text-rose" : "text-mid")}
            >
              {inr(admission.outstanding)} due
            </Text>
          </Box>
          {due ? (
            <>
              <Box className="mb-3 flex flex-wrap items-center gap-1.5">
                {PAY_MODES.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    className={cn(
                      chip,
                      mode === item && "border-dark bg-dark text-white hover:bg-dark",
                    )}
                    onClick={() => setMode(item)}
                  >
                    {PAY_LABEL[item]}
                  </Button>
                ))}
              </Box>
              <Button type="button" size="lg" block onClick={() => onDischarge(mode)}>
                Settle {inr(admission.outstanding)} ({PAY_LABEL[mode]}) & discharge
              </Button>
            </>
          ) : (
            <Button type="button" size="lg" block onClick={() => onDischarge(null)}>
              <IconCheck size={16} /> Discharge patient · free bed {admission.bed}
            </Button>
          )}
        </Box>
      ) : null}
    </WardDialog>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box>
      <Text as="span">{label}</Text>
      <Text as="span" className={cn("block text-[12.5px] font-bold text-ink", mono && "font-mono")}>
        {value}
      </Text>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2 text-[12.5px] text-muted">
      {label}
      <Text as="span" className="mt-px block font-display text-[15px] font-bold text-dark">
        {value}
      </Text>
    </Box>
  );
}
