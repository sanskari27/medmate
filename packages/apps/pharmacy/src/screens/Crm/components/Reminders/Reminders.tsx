import { timeAgo } from "@/utils";
import { crmMsg, refillsDue, type Patient, type ReminderLog } from "@/utils/calculations/crm";
import {
  Box,
  Button,
  Heading,
  MonoText,
  Pill,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import {
  IconClock,
  IconHeart,
  IconMessage,
  IconStethoscope,
  IconUser,
  IconWhatsApp,
} from "@/components/atoms";
import { Card, CardBody } from "@/components/molecules/Card";
import type { CrmViewProps } from "@/screens/Crm/Crm.types";
import { chronicPatientCount, openSms, openWhatsApp } from "@/screens/Crm/Crm.utils";

import type { RemindersProps } from "./Reminders.types";

const card = "!rounded-md !shadow-sm";
const crmTable =
  "!border-separate border-spacing-0 text-[13px] [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-100 [&_tbody_tr:hover]:bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0";
const th =
  "!sticky !top-0 z-[1] !border-b !border-line !bg-wash-2 !px-3.5 !py-[11px] !text-[10.5px] !font-bold !uppercase !tracking-[0.07em] !whitespace-nowrap !text-muted";
const td = "!border-b !border-line !px-3.5 !py-[11px] align-middle !text-ink-2";

export function Reminders({ view }: RemindersProps) {
  const due = refillsDue(view.patients, 14);
  return (
    <Stack gap={0}>
      <Stack direction="row" wrap className="mb-3.5 gap-[10px]">
        <SummaryChip label="Refills due (14d)" value={String(due.length)} />
        <SummaryChip label="Chronic patients" value={String(chronicPatientCount(view.patients))} />
        <SummaryChip label="Reminders sent" value={String(view.crm.reminders.length)} />
      </Stack>
      <Card className={card}>
        <Box className="overflow-x-auto">
          <Table className={crmTable}>
            <TableHead>
              <TableRow className="!border-0">
                <TableHeaderCell className={th}>Patient</TableHeaderCell>
                <TableHeaderCell className={th}>Medicine</TableHeaderCell>
                <TableHeaderCell className={th}>Due</TableHeaderCell>
                <TableHeaderCell className={th}>Phone</TableHeaderCell>
                <TableHeaderCell className={th}>Send reminder</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {due.length === 0 ? (
                <TableRow className="!border-0">
                  <TableCell colSpan={5} className={td}>
                    <Stack align="center" className="px-5 py-9 text-center text-muted">
                      <Box className="mb-3 grid h-11 w-11 place-items-center overflow-hidden rounded-md bg-wash text-mid">
                        <IconClock size={30} />
                      </Box>
                      <Text className="mx-auto max-w-[340px] !text-[13px] !text-muted">
                        No refills due in the next 14 days.
                      </Text>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                <DueRows patients={due} view={view} />
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>
      {view.crm.reminders.length > 0 ? (
        <Card className={`mt-3.5 ${card}`}>
          <Stack
            direction="row"
            align="center"
            wrap
            className="gap-2.5 border-b border-line px-[18px] py-[15px]"
          >
            <Heading level={3} className="!text-[15px] !font-bold !tracking-normal">
              Recent reminders sent
            </Heading>
          </Stack>
          <CardBody className="!p-[18px]">
            <ReminderRows reminders={view.crm.reminders.slice(0, 8)} now={view.now} />
          </CardBody>
        </Card>
      ) : null}
    </Stack>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2 text-[12.5px] text-muted">
      {label}
      <Text className="mt-px block font-display text-[15px] font-bold text-dark">{value}</Text>
    </Box>
  );
}

function DueRows({ patients, view }: { patients: Patient[]; view: CrmViewProps }) {
  return patients.map(function renderDue(patient) {
    return <DueRow key={patient.key} patient={patient} view={view} />;
  });
}

function DueRow({ patient, view }: { patient: Patient; view: CrmViewProps }) {
  function send(kind: "refill" | "adherence" | "followup", channel: "whatsapp" | "sms") {
    const text =
      kind === "refill"
        ? crmMsg.refill(patient.name, view.profile.name, patient.refill?.med ?? "your medicine")
        : kind === "adherence"
          ? crmMsg.adherence(patient.name, view.profile.name)
          : crmMsg.followup(patient.name, view.profile.name);
    if (channel === "whatsapp") openWhatsApp(patient.phone, text);
    else openSms(patient.phone, text);
    view.logReminder({ custKey: patient.key, custName: patient.name, kind, channel });
  }
  function sendRefill() {
    send("refill", "whatsapp");
  }
  function sendFollowup() {
    send("followup", "whatsapp");
  }
  function sendSms() {
    send("refill", "sms");
  }
  const daysLeft = patient.refill?.daysLeft ?? 0;
  return (
    <TableRow className="!border-0">
      <TableCell className={td}>
        <Stack direction="row" align="center" gap={0} className="gap-2.5">
          <Box className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-mid">
            <IconUser size={15} />
          </Box>
          <Text className="!font-bold !text-ink">{patient.name}</Text>
        </Stack>
      </TableCell>
      <TableCell className={td}>{patient.refill?.med}</TableCell>
      <TableCell className={td}>
        <Pill tone={daysLeft <= 0 ? "rose" : "gold"}>
          {daysLeft <= 0 ? "Overdue" : `in ${daysLeft}d`}
        </Pill>
      </TableCell>
      <TableCell className={td}>
        <MonoText className="!text-ink-2">{patient.phone || "—"}</MonoText>
      </TableCell>
      <TableCell className={td}>
        <Stack direction="row" className="gap-1.5">
          <Button variant="ghost" disabled={!patient.phone} onClick={sendRefill}>
            <IconWhatsApp size={14} /> Refill
          </Button>
          <Button
            variant="ghost"
            disabled={!patient.phone}
            title="Lab / follow-up"
            onClick={sendFollowup}
          >
            <IconStethoscope size={14} />
          </Button>
          <Button variant="ghost" disabled={!patient.phone} title="SMS" onClick={sendSms}>
            <IconMessage size={14} />
          </Button>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function ReminderRows({ reminders, now }: { reminders: ReminderLog[]; now: number }) {
  return reminders.map(function renderReminder(reminder) {
    return (
      <Stack
        key={reminder.id}
        direction="row"
        align="center"
        className="gap-3 border-b border-line py-3 last:border-0"
      >
        <Box className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-wash text-mid">
          {reminder.kind === "winback" ? (
            <IconHeart size={15} />
          ) : reminder.kind === "followup" ? (
            <IconStethoscope size={15} />
          ) : (
            <IconClock size={15} />
          )}
        </Box>
        <Stack className="min-w-0 flex-1">
          <Text className="!text-[13.5px] !font-bold !text-ink">{reminder.custName}</Text>
          <Text className="!text-[12px] !text-muted">
            {reminder.kind} · {reminder.channel}
          </Text>
        </Stack>
        <Text variant="caption" className="!text-[11.5px]">
          {timeAgo(reminder.at, now)}
        </Text>
      </Stack>
    );
  });
}
