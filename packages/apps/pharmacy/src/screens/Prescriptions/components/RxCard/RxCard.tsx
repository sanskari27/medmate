import {
  fmtMins,
  inr,
  RX_SLA_MINS,
  rxAvailability,
  rxOverdue,
  rxScheduledCount,
  rxTurnaroundMins,
  rxWaitMins,
  timeAgo,
  type InvProduct,
  type Prescription,
} from "@/utils";
import { Box, Button, Heading, Pill, Stack, Text } from "@/components/atoms";
import { IconAlert, IconArrowRight, IconBolt, IconCheck, IconClock, IconDoc, IconPill, IconStethoscope, IconX } from "@/components/atoms";
import { monogramOf } from "@/components/molecules/EntityMark";
import { ScheduleTag } from "@/components/molecules/ScheduleTag";
import { rxKindLabel, rxStatusLabel, rxStatusTone } from "@/screens/Prescriptions/Prescriptions.utils";

import type { RxCardProps } from "./RxCard.types";

export function RxCard({
  prescription,
  now,
  inventory,
  onOpen,
  onApprove,
  onReject,
  onDispense,
}: RxCardProps) {
  const availability = rxAvailability(prescription, inventory);
  const medicines = availability.items;
  const wait = rxWaitMins(prescription, now);
  const overdue = rxOverdue(prescription, now);
  const scheduled = rxScheduledCount(prescription, inventory);

  function productName(product: InvProduct) { return product.name; }
  return (
    <Box className={`flex flex-col overflow-hidden rounded-lg border bg-paper shadow-sm ${overdue ? "border-[#f0c4c4] shadow-[0_0_0_1px_#f0c4c4]" : "border-line"}`}>
      <Stack direction="row" align="start" justify="between" gap={2} className="px-4 py-3">
        <Stack direction="row" align="center" gap={2} className="min-w-0 flex-1">
          <Box className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${prescription.kind === "digital" ? "bg-[#efeafc] text-[#6d4fc4]" : "bg-wash text-mid"}`}>
            {prescription.kind === "digital" ? <IconPill size={15} /> : <IconDoc size={15} />}
          </Box>
          <Box>
            <Heading level={3} className="flex items-center gap-1.5 text-[13.5px] leading-[22px]">
              {prescription.id}
              {prescription.urgent ? <Pill tone="rose"><IconBolt size={10} /> Urgent</Pill> : null}
            </Heading>
            <Text variant="caption">{timeAgo(prescription.uploadedAt, now)}</Text>
          </Box>
        </Stack>
        <Pill tone={rxStatusTone(prescription.status)} dot>{rxStatusLabel(prescription.status)}</Pill>
      </Stack>

      <Box className="px-4 py-2.5">
        <Button variant="ghost" className="h-auto w-full justify-start border-transparent bg-transparent px-0 py-1 text-left shadow-none" onClick={onOpen}>
          <Box className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wash font-bold text-mid">{prescription.patient[0]}</Box>
          <Stack className="min-w-0 flex-1">
            <Text className="font-bold">{prescription.patient}</Text>
            <Text variant="caption" className="truncate">
              <IconStethoscope size={11} /> {prescription.doctor}
              {prescription.regNo ? ` · ${prescription.regNo}` : ""}
            </Text>
          </Stack>
          <Pill tone="gray">{rxKindLabel(prescription.kind)}</Pill>
        </Button>

        {prescription.status === "pending" ? (
          <Text variant="caption" className={`mt-2 flex items-center gap-1 font-bold ${overdue ? "text-rose" : "text-gold-d"}`}>
            <IconClock size={12} /> Waiting {fmtMins(wait)}
            {overdue ? ` · over ${RX_SLA_MINS / 60}h SLA` : ` · SLA ${RX_SLA_MINS / 60}h`}
          </Text>
        ) : null}
        {prescription.status === "approved" && prescription.approvedAt ? (
          <Text variant="caption" className="mt-2 flex items-center gap-1 font-bold text-mid">
            <IconCheck size={12} /> Approved {timeAgo(prescription.approvedAt, now)}
            {prescription.reviewedBy ? ` · ${prescription.reviewedBy}` : ""}
          </Text>
        ) : null}
        {prescription.status === "dispensed" ? (
          <Text variant="caption" className="mt-2 flex items-center gap-1 font-bold text-mid">
            <IconCheck size={12} /> Dispensed
            {rxTurnaroundMins(prescription) != null ? ` in ${fmtMins(rxTurnaroundMins(prescription))}` : ""}
          </Text>
        ) : null}
        {prescription.status === "rejected" ? (
          <Text variant="caption" className="mt-2 flex items-center gap-1 font-bold text-rose">
            <IconX size={12} /> {prescription.rejectReason || "Rejected"}
          </Text>
        ) : null}

        {medicines.length > 0 ? (
          <Box>
            <Stack direction="row" justify="between" className="mt-2 text-[11px] font-bold uppercase tracking-wide text-muted">
              <Text as="span" variant="label">Verified medicines</Text>
              <Text as="span" variant="caption">{availability.inStock}/{availability.total} in stock{scheduled ? ` · ${scheduled} Rx-only` : ""}</Text>
            </Stack>
            <MedicineRows medicines={medicines.slice(0, 3)} />
            {medicines.length > 3 ? <Text variant="caption" className="mt-0.5">+{medicines.length - 3} more…</Text> : null}
            <Stack direction="row" justify="between" className="mt-2 border-t border-line pt-2 text-[13px]">
              <Text as="span">Est. bill value</Text>
              <Text as="span" className="font-extrabold">{inr(availability.value)}</Text>
            </Stack>
          </Box>
        ) : null}
        {availability.outOfStock.length > 0 ? (
          <Text variant="caption" className="mt-2 flex items-center gap-1 font-bold text-rose">
            <IconAlert size={12} /> {availability.outOfStock.map(productName).join(", ")} out of stock
          </Text>
        ) : null}
        {prescription.note && medicines.length === 0 ? (
          <Text variant="muted" className="mt-1.5 text-[12px] italic">“{prescription.note}”</Text>
        ) : null}
      </Box>

      <Stack direction="row" gap={2} className="mt-auto border-t border-line px-4 py-3">
        {prescription.status === "pending" ? (
          <>
            <Button size="sm" variant="rose" onClick={onReject}><IconX size={14} /> Reject</Button>
            <Button size="sm" variant="ghost" onClick={onApprove}><IconCheck size={14} /> Approve</Button>
            <Button size="sm" onClick={onDispense}>Dispense <IconArrowRight size={14} /></Button>
          </>
        ) : null}
        {prescription.status === "approved" ? (
          <Button size="sm" block onClick={onDispense}>Dispense → billing <IconArrowRight size={14} /></Button>
        ) : null}
        {prescription.status === "dispensed" ? (
          <Button size="sm" variant="ghost" block onClick={onOpen}>View details</Button>
        ) : null}
        {prescription.status === "rejected" ? (
          <Button size="sm" variant="ghost" block onClick={onOpen}>View & re-notify</Button>
        ) : null}
      </Stack>
    </Box>
  );
}

function MedicineRows({ medicines }: { medicines: ReturnType<typeof rxAvailability>["items"] }) {
  function renderMedicine(item: ReturnType<typeof rxAvailability>["items"][number]) {
    return (
      <Stack key={item.product.id} direction="row" align="center" justify="between" gap={2} className="py-1 text-[12.5px]">
        <Text as="span" className="min-w-0 truncate">
          <Text as="span" className="mr-1 inline-grid h-5 w-5 place-items-center rounded bg-wash text-[10px] font-bold text-mid">{monogramOf(item.product.name)}</Text>
          {item.product.name}
          {item.rx ? <ScheduleTag schedule={item.product.schedule} /> : null}
        </Text>
        <Text as="span" className={item.stock > 0 ? "font-bold" : "font-bold text-rose"}>{item.stock > 0 ? inr(item.price) : "Out"}</Text>
      </Stack>
    );
  }
  return medicines.map(renderMedicine);
}
