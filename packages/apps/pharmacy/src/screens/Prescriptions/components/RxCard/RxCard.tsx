import {
  fmtMins,
  inr,
  RX_SLA_MINS,
  rxAvailability,
  rxOverdue,
  rxScheduledCount,
  rxTurnaroundMins,
  rxWaitMins,
  SCHEDULE_META,
  timeAgo,
  type InvProduct,
} from "@/utils";
import { Box, Button, Heading, Pill, Stack, Text } from "@/components/atoms";
import {
  IconAlert,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconClock,
  IconDoc,
  IconPill,
  IconStethoscope,
  IconX,
} from "@/components/atoms";
import { monogramOf } from "@/components/molecules/EntityMark";
import {
  rxKindLabel,
  rxStatusLabel,
  rxStatusTone,
} from "@/screens/Prescriptions/Prescriptions.utils";

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

  function productName(product: InvProduct) {
    return product.name;
  }
  return (
    <Box
      className={`flex flex-col overflow-hidden rounded-md border bg-paper ${overdue ? "border-[#f0c4c4] shadow-[0_0_0_1px_#f0c4c4]" : "border-line shadow-sm"}`}
    >
      <Stack
        direction="row"
        align="start"
        justify="between"
        wrap={false}
        className="gap-2.5 border-b border-line px-[18px] py-[15px]"
      >
        <Stack direction="row" align="center" className="min-w-0 flex-1 gap-1.5">
          <Box
            className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] ${prescription.kind === "digital" ? "bg-[#efeafc] text-[#6d4fc4]" : "bg-wash text-mid"}`}
          >
            {prescription.kind === "digital" ? <IconPill size={15} /> : <IconDoc size={15} />}
          </Box>
          <Box className="min-w-0">
            <Heading
              level={3}
              className="!flex !items-center !gap-1.5 !text-[13.5px] !leading-[22px] !font-bold !tracking-normal"
            >
              {prescription.id}
              {prescription.urgent ? (
                <Pill tone="rose" className="!px-[7px] !py-px !text-[10px] !leading-[1.2]">
                  <IconBolt size={10} /> Urgent
                </Pill>
              ) : null}
            </Heading>
            <Text variant="caption" className="text-[12.5px]">
              {timeAgo(prescription.uploadedAt, now)}
            </Text>
          </Box>
        </Stack>
        <Pill
          tone={rxStatusTone(prescription.status)}
          dot
          className="!gap-[5px] !px-[7px] !py-px !text-[10px] !leading-[1.2]"
        >
          {rxStatusLabel(prescription.status)}
        </Pill>
      </Stack>

      <Box className="flex-1 px-[18px] py-2.5">
        <Button
          variant="ghost"
          className="!mb-2.5 !h-auto !w-full !min-w-0 !justify-start !gap-2.5 !rounded-[11px] !border-line !bg-wash-2 !px-[11px] !py-[9px] !text-left !font-normal !whitespace-normal !shadow-none hover:!border-line-2 hover:!bg-wash"
          onClick={onOpen}
        >
          <Box className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mid text-[14px] font-extrabold text-white">
            {prescription.patient[0]}
          </Box>
          <Stack className="min-w-0 flex-1 gap-0">
            <Text as="span" className="truncate text-[13px] font-bold text-ink">
              {prescription.patient}
            </Text>
            <Text
              as="span"
              variant="caption"
              className="flex min-w-0 items-center gap-1 truncate text-[11.5px]"
            >
              <IconStethoscope size={11} /> {prescription.doctor}
              {prescription.regNo ? ` · ${prescription.regNo}` : ""}
            </Text>
          </Stack>
          <Pill tone="gray">{rxKindLabel(prescription.kind)}</Pill>
        </Button>

        {prescription.status === "pending" ? (
          <Text
            as="span"
            className={`!mb-2 !inline-flex !items-center !gap-[5px] !rounded-[7px] !px-2 !py-1 !text-[11.5px] !font-bold ${overdue ? "!bg-rose-bg !text-rose" : "!bg-amber-bg !text-amber"}`}
          >
            <IconClock size={12} /> Waiting {fmtMins(wait)}
            {overdue ? ` · over ${RX_SLA_MINS / 60}h SLA` : ` · SLA ${RX_SLA_MINS / 60}h`}
          </Text>
        ) : null}
        {prescription.status === "approved" && prescription.approvedAt ? (
          <Text
            as="span"
            className="!mb-2 !inline-flex !items-center !gap-[5px] !rounded-[7px] !bg-wash !px-2 !py-1 !text-[11.5px] !font-bold !text-mid"
          >
            <IconCheck size={12} /> Approved {timeAgo(prescription.approvedAt, now)}
            {prescription.reviewedBy ? ` · ${prescription.reviewedBy}` : ""}
          </Text>
        ) : null}
        {prescription.status === "dispensed" ? (
          <Text
            as="span"
            className="!mb-2 !inline-flex !items-center !gap-[5px] !rounded-[7px] !bg-wash !px-2 !py-1 !text-[11.5px] !font-bold !text-mid"
          >
            <IconCheck size={12} /> Dispensed
            {rxTurnaroundMins(prescription) != null
              ? ` in ${fmtMins(rxTurnaroundMins(prescription))}`
              : ""}
          </Text>
        ) : null}
        {prescription.status === "rejected" ? (
          <Text
            as="span"
            className="!mb-2 !inline-flex !items-center !gap-[5px] !rounded-[7px] !bg-rose-bg !px-2 !py-1 !text-[11.5px] !font-bold !text-rose"
          >
            <IconX size={12} /> {prescription.rejectReason || "Rejected"}
          </Text>
        ) : null}

        {medicines.length > 0 ? (
          <Box>
            <Stack
              direction="row"
              justify="between"
              className="!mt-1.5 !mb-[5px] !items-baseline !text-[11px] !font-extrabold !tracking-[0.04em] !text-muted !uppercase"
            >
              <Text
                as="span"
                className="!text-[11px] !font-extrabold !tracking-[0.04em] !text-muted !uppercase"
              >
                Verified medicines
              </Text>
              <Text
                as="span"
                className="!text-[11px] !font-semibold !tracking-normal !text-green !normal-case"
              >
                {availability.inStock}/{availability.total} in stock
                {scheduled ? ` · ${scheduled} Rx-only` : ""}
              </Text>
            </Stack>
            <MedicineRows medicines={medicines.slice(0, 3)} />
            {medicines.length > 3 ? (
              <Text className="mt-0.5 text-[11.5px] text-muted">+{medicines.length - 3} more…</Text>
            ) : null}
            <Stack
              direction="row"
              justify="between"
              align="center"
              className="mt-2 border-t border-dashed border-line-2 pt-2 text-[12.5px] text-muted"
            >
              <Text as="span">Est. bill value</Text>
              <Text as="span" className="font-display text-[15px] font-bold text-ink">
                {inr(availability.value)}
              </Text>
            </Stack>
          </Box>
        ) : null}
        {availability.outOfStock.length > 0 ? (
          <Text className="mt-2 flex items-center gap-1.5 rounded-sm bg-rose-bg px-[9px] py-1.5 text-[11.5px] font-semibold text-rose">
            <IconAlert size={12} /> {availability.outOfStock.map(productName).join(", ")} out of
            stock
          </Text>
        ) : null}
        {prescription.note && medicines.length === 0 ? (
          <Text className="mt-1.5 text-[12px] text-muted italic">“{prescription.note}”</Text>
        ) : null}
      </Box>

      <Stack
        direction="row"
        justify="end"
        className="mt-auto gap-2.5 border-t border-line px-5 py-[14px]"
      >
        {prescription.status === "pending" ? (
          <>
            <Button size="sm" variant="rose" onClick={onReject}>
              <IconX size={14} /> Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={onApprove}>
              <IconCheck size={14} /> Approve
            </Button>
            <Button size="sm" onClick={onDispense}>
              Dispense <IconArrowRight size={14} />
            </Button>
          </>
        ) : null}
        {prescription.status === "approved" ? (
          <Button size="sm" block onClick={onDispense}>
            Dispense → billing <IconArrowRight size={14} />
          </Button>
        ) : null}
        {prescription.status === "dispensed" ? (
          <Button size="sm" variant="ghost" block onClick={onOpen}>
            View details
          </Button>
        ) : null}
        {prescription.status === "rejected" ? (
          <Button size="sm" variant="ghost" block onClick={onOpen}>
            View & re-notify
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}

function MedicineRows({ medicines }: { medicines: ReturnType<typeof rxAvailability>["items"] }) {
  function renderMedicine(item: ReturnType<typeof rxAvailability>["items"][number]) {
    return (
      <Stack
        key={item.product.id}
        direction="row"
        align="center"
        justify="between"
        gap={2}
        className="py-1 text-[13px]"
      >
        <Text as="span" className="!flex !min-w-0 !items-center !gap-1.5 !text-[13px] !text-ink">
          <Text as="span" className="text-[15px]">
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
        </Text>
        <Text
          as="span"
          className={
            item.stock > 0
              ? "font-bold whitespace-nowrap"
              : "font-extrabold whitespace-nowrap text-rose"
          }
        >
          {item.stock > 0 ? inr(item.price) : "Out"}
        </Text>
      </Stack>
    );
  }
  return medicines.map(renderMedicine);
}
