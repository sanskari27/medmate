import { useState, type ChangeEvent } from "react";
import type { Prescription } from "@/utils";
import { Button, Stack, Text, Textarea } from "@/components/atoms";
import { IconCheck, IconX } from "@/components/atoms";
import { Field } from "@/components/molecules/Field";
import { Modal } from "@/components/molecules/Modal";
import { REJECT_REASONS } from "@/screens/Prescriptions/Prescriptions.utils";

import type { RejectModalProps } from "./RejectModal.types";

export function RejectModal({
  rx,
  onClose,
  onConfirm,
}: RejectModalProps) {
  const [reason, setReason] = useState(REJECT_REASONS[0]);

  function handleReason(event: ChangeEvent<HTMLTextAreaElement>) {
    setReason(event.target.value);
  }

  function handleConfirm() {
    onConfirm(reason.trim());
  }

  return (
    <Modal
      title={`Reject ${rx.id}`}
      size="sm"
      className="max-w-[460px]"
      overlayClassName="z-[100] bg-[#0d201580] p-6 backdrop-blur-[3px]"
      onClose={onClose}
      footer={
        <Stack direction="row" justify="end" gap={2}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="rose" disabled={!reason.trim()} onClick={handleConfirm}><IconX size={14} /> Reject prescription</Button>
        </Stack>
      }
    >
      <Text variant="muted" className="text-[12.5px]">Pick a reason — {rx.patient} will see this so they can fix & re-upload.</Text>
      <Stack className="mt-3 gap-[7px]">
        <ReasonOptions reason={reason} onSelect={setReason} />
      </Stack>
      <Field label="Or write your own" htmlFor="reject-reason" className="mt-2.5">
        <Textarea id="reject-reason" rows={2} value={reason} onChange={handleReason} className="resize-y" />
      </Field>
    </Modal>
  );
}

function ReasonOptions({ reason, onSelect }: { reason: string; onSelect: (reason: string) => void }) {
  return REJECT_REASONS.map(function renderReason(option) {
    return <ReasonOption key={option} option={option} selected={reason === option} onSelect={onSelect} />;
  });
}

function ReasonOption({ option, selected, onSelect }: { option: string; selected: boolean; onSelect: (reason: string) => void }) {
  function handleSelect() {
    onSelect(option);
  }
  return (
    <Button variant="ghost" className={`h-auto justify-start gap-[7px] rounded-[9px] px-[11px] py-[9px] text-left text-[12.5px] font-normal whitespace-normal ${selected ? "border-rose bg-rose-bg font-semibold text-[#a0281f] hover:bg-rose-bg" : "text-ink-2 hover:bg-wash-2"}`} onClick={handleSelect}>
      {selected ? <IconCheck size={13} /> : null}
      {option}
    </Button>
  );
}
