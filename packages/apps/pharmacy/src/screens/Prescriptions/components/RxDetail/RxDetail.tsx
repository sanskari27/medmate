import {
  fmtDateTime,
  inr,
  rxAvailability,
  SCHEDULE_META,
  smsLink,
  waLink,
  type InvProduct,
} from "@/utils";
import {
  Box,
  Button,
  Pill,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Text,
} from "@/components/atoms";
import {
  IconAlert,
  IconArrowRight,
  IconBolt,
  IconBox,
  IconCheck,
  IconClock,
  IconDoc,
  IconPhone,
  IconUser,
  IconWhatsApp,
  IconX,
} from "@/components/atoms";
import { ChannelPill } from "@/components/molecules/ChannelPill";
import { monogramOf } from "@/components/molecules/EntityMark";
import { Modal } from "@/components/molecules/Modal";
import { RxView } from "@/components/organisms";
import {
  notifyMessage,
  prescriptionTimeline,
  rejectedMessage,
  rxStatusLabel,
  rxStatusTone,
} from "@/screens/Prescriptions/Prescriptions.utils";

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

  function productName(product: InvProduct) {
    return product.name;
  }
  return (
    <Modal
      title={`Prescription ${rx.id}`}
      size="lg"
      className="!max-h-[90vh] !max-w-[720px] !overflow-hidden max-[767px]:!max-h-[92dvh] max-[767px]:!max-w-none max-[767px]:!rounded-b-none max-[767px]:!rounded-t-2xl"
      overlayClassName="z-[100] bg-[#0d201580] p-6 backdrop-blur-[3px] max-[767px]:!items-end max-[767px]:!p-0"
      onClose={onClose}
      footer={
        <Stack direction="row" justify="end" wrap gap={2}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {rx.status === "pending" ? (
            <>
              <Button variant="rose" onClick={onReject}>
                <IconX size={14} /> Reject
              </Button>
              <Button variant="line" onClick={onApprove}>
                <IconCheck size={14} /> Approve
              </Button>
              <Button onClick={onDispense}>
                Dispense → billing <IconArrowRight size={15} />
              </Button>
            </>
          ) : null}
          {rx.status === "approved" ? (
            <Button onClick={onDispense}>
              Dispense → billing <IconArrowRight size={15} />
            </Button>
          ) : null}
          {rx.status === "rejected" && phone ? (
            <Button asChild>
              <a href={waLink(phone, rejected)} target="_blank" rel="noreferrer">
                <IconWhatsApp size={14} /> Notify patient
              </a>
            </Button>
          ) : null}
        </Stack>
      }
    >
      <Box>
        <Stack direction="row" align="center" gap={2} className="mb-3">
          <Pill tone={rxStatusTone(rx.status)}>{rxStatusLabel(rx.status)}</Pill>
          {rx.urgent ? (
            <Pill tone="rose">
              <IconBolt size={10} /> Urgent
            </Pill>
          ) : null}
        </Stack>
        <Box className="grid grid-cols-1 items-start gap-[18px] min-[768px]:grid-cols-2">
          <RxView rx={rx} />
          <Stack gap={3}>
            <Box className="rounded-md border border-line bg-paper px-[13px] py-3">
              <Stack
                direction="row"
                align="center"
                className="mb-[9px] gap-1.5 text-[11px] font-extrabold tracking-[0.05em] text-muted uppercase"
              >
                <IconUser size={13} /> Patient
              </Stack>
              <KeyValue label="Name" value={rx.patient} />
              <KeyValue label="Phone" value={rx.phone || "—"} />
              <Stack direction="row" align="center" className="gap-2.5 py-0.5 text-[12.5px]">
                <Text as="span" className="min-w-[66px] text-muted">
                  Channel
                </Text>
                <ChannelPill channel={rx.channel} />
              </Stack>
              <KeyValue label="Doctor" value={`${rx.doctor}${rx.regNo ? ` · ${rx.regNo}` : ""}`} />
              {phone ? (
                <Stack direction="row" wrap gap={2} className="mt-2">
                  <Button asChild size="sm" variant="line">
                    <a href={`tel:${dial}`}>
                      <IconPhone size={13} /> Call
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="whatsapp">
                    <a href={waLink(phone, message)} target="_blank" rel="noreferrer">
                      <IconWhatsApp size={13} /> WhatsApp
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="line">
                    <a href={smsLink(phone, message)}>SMS</a>
                  </Button>
                </Stack>
              ) : null}
            </Box>

            <Box className="rounded-md border border-line bg-paper px-[13px] py-3">
              <Stack
                direction="row"
                align="center"
                className="mb-[9px] gap-1.5 text-[11px] font-extrabold tracking-[0.05em] text-muted uppercase"
              >
                <IconClock size={13} /> Timeline
              </Stack>
              <Timeline events={events} />
            </Box>

            {availability.total > 0 ? (
              <Box className="rounded-md border border-line bg-paper px-[13px] py-3">
                <Stack
                  direction="row"
                  align="center"
                  justify="between"
                  className="mb-[9px] gap-1.5 text-[11px] font-extrabold tracking-[0.05em] text-muted uppercase"
                >
                  <Text as="span">
                    <IconBox size={13} /> Verified medicines
                  </Text>
                  <Text className="text-[11.5px] font-semibold tracking-normal text-muted normal-case">
                    {availability.inStock}/{availability.total} in stock
                  </Text>
                </Stack>
                <Table>
                  <TableBody>
                    <MedicineRows items={availability.items} />
                    <TableRow className="border-t border-line">
                      <TableCell colSpan={2} className="border-t border-line px-1 py-1.5">
                        <Text as="span" className="font-bold">
                          Estimated bill
                        </Text>
                      </TableCell>
                      <TableCell
                        align="right"
                        className="border-t border-line px-1 py-1.5 font-extrabold"
                      >
                        {inr(availability.value)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                {availability.outOfStock.length > 0 ? (
                  <Text className="mt-2 flex items-center gap-1.5 rounded-sm bg-rose-bg px-[9px] py-1.5 text-[11.5px] font-semibold text-rose">
                    <IconAlert size={12} /> {availability.outOfStock.map(productName).join(", ")}{" "}
                    out of stock — suggest a substitute or reorder.
                  </Text>
                ) : null}
              </Box>
            ) : null}
            {rx.note ? (
              <Box className="rounded-md border border-line bg-paper px-[13px] py-3">
                <Stack
                  direction="row"
                  align="center"
                  className="mb-[9px] gap-1.5 text-[11px] font-extrabold tracking-[0.05em] text-muted uppercase"
                >
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
    <Stack direction="row" className="gap-2.5 py-0.5 text-[12.5px]">
      <Text as="span" className="min-w-[66px] text-muted">
        {label}
      </Text>
      <Text as="span" className="font-semibold text-ink">
        {value}
      </Text>
    </Stack>
  );
}

function Timeline({ events }: { events: { label: string; at: number; tone: "done" | "bad" }[] }) {
  function renderEvent(event: { label: string; at: number; tone: "done" | "bad" }, index: number) {
    return (
      <Box
        key={`${event.label}-${index}`}
        className="grid grid-cols-[16px_1fr_auto] items-center gap-2 py-[3px] text-[12.5px]"
      >
        <Box
          className={`h-[9px] w-[9px] justify-self-center rounded-full ${event.tone === "bad" ? "bg-rose" : "bg-mid"}`}
        />
        <Text as="span" className="font-semibold text-ink">
          {event.label}
        </Text>
        <Text as="span" className="text-[11px] whitespace-nowrap text-muted">
          {fmtDateTime(event.at)}
        </Text>
      </Box>
    );
  }
  return events.map(renderEvent);
}

function MedicineRows({ items }: { items: ReturnType<typeof rxAvailability>["items"] }) {
  function renderItem(item: ReturnType<typeof rxAvailability>["items"][number]) {
    return (
      <TableRow key={item.product.id}>
        <TableCell className="px-1 py-1.5 text-[12.5px] text-ink-2">
          <Text as="span" className="mr-1.5 text-[15px]">
            {monogramOf(item.product.name)}
          </Text>
          {item.product.name}
          {item.rx ? (
            <Text
              as="span"
              title={SCHEDULE_META[item.product.schedule].note}
              className="ml-[5px] rounded-[4px] bg-[#fdeccb] px-1 py-px text-[9px] font-extrabold tracking-[0.02em] text-[#8a4b00]"
            >
              {SCHEDULE_META[item.product.schedule].label}
            </Text>
          ) : null}
        </TableCell>
        <TableCell
          align="right"
          className={
            item.stock > 0
              ? "px-1 py-1.5 text-[12px] text-ink-2"
              : "px-1 py-1.5 text-[12px] font-bold text-rose"
          }
        >
          {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
        </TableCell>
        <TableCell align="right" className="px-1 py-1.5 font-bold">
          {inr(item.price)}
        </TableCell>
      </TableRow>
    );
  }
  return items.map(renderItem);
}
