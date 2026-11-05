import {
  fmtDateTime,
  inr,
  rxAvailability,
  smsLink,
  waLink,
  type InvProduct,
  type Prescription,
} from "@/utils";
import { Box, Button, Pill, Stack, Table, TableBody, TableCell, TableRow, Text } from "@/components/atoms";
import { IconAlert, IconArrowRight, IconBolt, IconBox, IconCheck, IconClock, IconDoc, IconPhone, IconUser, IconWhatsApp, IconX } from "@/components/atoms";
import { ChannelPill } from "@/components/molecules/ChannelPill";
import { monogramOf } from "@/components/molecules/EntityMark";
import { Modal } from "@/components/molecules/Modal";
import { ScheduleTag } from "@/components/molecules/ScheduleTag";
import RxView from "@/components/RxView";
import { notifyMessage, prescriptionTimeline, rejectedMessage, rxStatusLabel, rxStatusTone } from "@/screens/Prescriptions/Prescriptions.utils";

import type { RxDetailProps } from "./RxDetail.types";

export function RxDetail({
  rx,
  inventory,
  onClose,
  onApprove,
  onReject,
  onDispense,
}: RxDetailProps) {
  const availability = rxAvailability(rx, inventory);
  const phone = rx.phone && rx.phone !== "—" ? rx.phone : "";
  const events = prescriptionTimeline(rx);
  const rejected = rejectedMessage(rx);
  const message = notifyMessage(rx, availability.value);
  const dial = phone.replace(/\s/g, "");

  function productName(product: InvProduct) { return product.name; }
  return (
    <Modal
      title={`Prescription ${rx.id}`}
      size="lg"
      className="max-w-5xl"
      onClose={onClose}
      footer={
        <Stack direction="row" justify="end" wrap gap={2}>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {rx.status === "pending" ? (
            <>
              <Button variant="rose" onClick={onReject}><IconX size={14} /> Reject</Button>
              <Button variant="line" onClick={onApprove}><IconCheck size={14} /> Approve</Button>
              <Button onClick={onDispense}>Dispense → billing <IconArrowRight size={15} /></Button>
            </>
          ) : null}
          {rx.status === "approved" ? (
            <Button onClick={onDispense}>Dispense → billing <IconArrowRight size={15} /></Button>
          ) : null}
          {rx.status === "rejected" && phone ? (
            <Button asChild>
              <a href={waLink(phone, rejected)} target="_blank" rel="noreferrer"><IconWhatsApp size={14} /> Notify patient</a>
            </Button>
          ) : null}
        </Stack>
      }
    >
      <Box className="max-h-[60vh] overflow-y-auto">
        <Stack direction="row" align="center" gap={2} className="mb-3">
          <Pill tone={rxStatusTone(rx.status)}>{rxStatusLabel(rx.status)}</Pill>
          {rx.urgent ? <Pill tone="rose"><IconBolt size={10} /> Urgent</Pill> : null}
        </Stack>
        <Box className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <RxView rx={rx} />
          <Stack gap={3}>
            <Box className="rounded-md border border-line p-3">
              <Stack direction="row" align="center" gap={1} className="mb-2 text-[12px] font-extrabold uppercase tracking-wide text-muted">
                <IconUser size={13} /> Patient
              </Stack>
              <KeyValue label="Name" value={rx.patient} />
              <KeyValue label="Phone" value={rx.phone || "—"} />
              <Stack direction="row" justify="between" className="py-1 text-[13px]">
                <Text as="span" variant="muted">Channel</Text>
                <ChannelPill channel={rx.channel} />
              </Stack>
              <KeyValue label="Doctor" value={`${rx.doctor}${rx.regNo ? ` · ${rx.regNo}` : ""}`} />
              {phone ? (
                <Stack direction="row" wrap gap={2} className="mt-2">
                  <Button asChild size="sm" variant="line"><a href={`tel:${dial}`}><IconPhone size={13} /> Call</a></Button>
                  <Button asChild size="sm" variant="whatsapp"><a href={waLink(phone, message)} target="_blank" rel="noreferrer"><IconWhatsApp size={13} /> WhatsApp</a></Button>
                  <Button asChild size="sm" variant="line"><a href={smsLink(phone, message)}>SMS</a></Button>
                </Stack>
              ) : null}
            </Box>

            <Box className="rounded-md border border-line p-3">
              <Stack direction="row" align="center" gap={1} className="mb-2 text-[12px] font-extrabold uppercase tracking-wide text-muted">
                <IconClock size={13} /> Timeline
              </Stack>
              <Timeline events={events} />
            </Box>

            {availability.total > 0 ? (
              <Box className="rounded-md border border-line p-3">
                <Stack direction="row" align="center" justify="between" className="mb-2 text-[12px] font-extrabold uppercase tracking-wide text-muted">
                  <Text as="span" variant="label"><IconBox size={13} /> Verified medicines</Text>
                  <Text variant="caption">{availability.inStock}/{availability.total} in stock</Text>
                </Stack>
                <Table>
                  <TableBody>
                    <MedicineRows items={availability.items} />
                    <TableRow>
                      <TableCell colSpan={2}><Text as="span" className="font-bold">Estimated bill</Text></TableCell>
                      <TableCell align="right" className="font-extrabold">{inr(availability.value)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                {availability.outOfStock.length > 0 ? (
                  <Text variant="caption" className="mt-2 flex items-center gap-1 font-bold text-rose">
                    <IconAlert size={12} /> {availability.outOfStock.map(productName).join(", ")} out of stock — suggest a substitute or reorder.
                  </Text>
                ) : null}
              </Box>
            ) : null}
            {rx.note ? (
              <Box className="rounded-md border border-line p-3">
                <Stack direction="row" align="center" gap={1} className="mb-2 text-[12px] font-extrabold uppercase tracking-wide text-muted">
                  <IconDoc size={13} /> Note
                </Stack>
                <Text className="text-[12.5px] text-ink-2">{rx.note}</Text>
              </Box>
            ) : null}
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justify="between" gap={3} className="py-1 text-[13px]">
      <Text as="span" variant="muted">{label}</Text>
      <Text as="span" className="text-right font-bold">{value}</Text>
    </Stack>
  );
}

function Timeline({ events }: { events: { label: string; at: number; tone: "done" | "bad" }[] }) {
  function renderEvent(event: { label: string; at: number; tone: "done" | "bad" }, index: number) {
    return (
      <Stack key={`${event.label}-${index}`} direction="row" align="center" gap={2} className="py-1 text-[12.5px]">
        <Box className={`h-2 w-2 rounded-full ${event.tone === "bad" ? "bg-rose" : "bg-mid"}`} />
        <Text as="span" className="flex-1">{event.label}</Text>
        <Text as="span" variant="caption">{fmtDateTime(event.at)}</Text>
      </Stack>
    );
  }
  return events.map(renderEvent);
}

function MedicineRows({ items }: { items: ReturnType<typeof rxAvailability>["items"] }) {
  function renderItem(item: ReturnType<typeof rxAvailability>["items"][number]) {
    return (
      <TableRow key={item.product.id}>
        <TableCell>
          <Text as="span" className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded bg-wash text-[10px] font-bold text-mid">{monogramOf(item.product.name)}</Text>
          {item.product.name}
          {item.rx ? <ScheduleTag schedule={item.product.schedule} /> : null}
        </TableCell>
        <TableCell align="right" className={item.stock > 0 ? "text-[12px]" : "text-[12px] text-rose"}>
          {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
        </TableCell>
        <TableCell align="right" className="font-bold">{inr(item.price)}</TableCell>
      </TableRow>
    );
  }
  return items.map(renderItem);
}
