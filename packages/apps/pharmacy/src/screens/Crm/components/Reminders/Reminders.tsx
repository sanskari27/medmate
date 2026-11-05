import { timeAgo } from "@/utils";
import { crmMsg, refillsDue, type Patient, type ReminderLog } from "@/utils/calculations/crm";
import { Box, Button, MonoText, Pill, Stack, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { IconClock, IconHeart, IconMessage, IconStethoscope, IconUser, IconWhatsApp } from "@/components/atoms";
import { Card, CardBody, CardHeader } from "@/components/molecules/Card";
import { EmptyState } from "@/components/molecules/EmptyState";
import type { CrmViewProps } from "@/screens/Crm/Crm.types";
import { chronicPatientCount, openSms, openWhatsApp } from "@/screens/Crm/Crm.utils";

import type { RemindersProps } from "./Reminders.types";
export function Reminders({ view }: RemindersProps) {
  const due = refillsDue(view.patients, 14);
  return (
    <Stack gap={3}>
      <Stack direction="row" wrap gap={2}>
        <SummaryChip label="Refills due (14d)" value={String(due.length)} />
        <SummaryChip label="Chronic patients" value={String(chronicPatientCount(view.patients))} />
        <SummaryChip label="Reminders sent" value={String(view.crm.reminders.length)} />
      </Stack>
      <Card>
        <Box className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Medicine</TableHeaderCell>
                <TableHeaderCell>Due</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
                <TableHeaderCell>Send reminder</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {due.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}><EmptyState title="No refills due in the next 14 days." /></TableCell>
                </TableRow>
              ) : (
                <DueRows patients={due} view={view} />
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>
      {view.crm.reminders.length > 0 ? (
        <Card>
          <CardHeader title="Recent reminders sent" />
          <CardBody>
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
      <Text className="mt-px block font-display text-[15px] font-extrabold text-dark">{value}</Text>
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
    const text = kind === "refill"
      ? crmMsg.refill(patient.name, view.profile.name, patient.refill?.med ?? "your medicine")
      : kind === "adherence"
        ? crmMsg.adherence(patient.name, view.profile.name)
        : crmMsg.followup(patient.name, view.profile.name);
    if (channel === "whatsapp") openWhatsApp(patient.phone, text);
    else openSms(patient.phone, text);
    view.logReminder({ custKey: patient.key, custName: patient.name, kind, channel });
  }
  function sendRefill() { send("refill", "whatsapp"); }
  function sendFollowup() { send("followup", "whatsapp"); }
  function sendSms() { send("refill", "sms"); }
  const daysLeft = patient.refill?.daysLeft ?? 0;
  return (
    <TableRow>
      <TableCell>
        <Stack direction="row" align="center" gap={2}>
          <Box className="grid h-8 w-8 place-items-center rounded-md bg-wash text-mid"><IconUser size={15} /></Box>
          <Text className="font-bold">{patient.name}</Text>
        </Stack>
      </TableCell>
      <TableCell>{patient.refill?.med}</TableCell>
      <TableCell><Pill tone={daysLeft <= 0 ? "rose" : "gold"}>{daysLeft <= 0 ? "Overdue" : `in ${daysLeft}d`}</Pill></TableCell>
      <TableCell><MonoText>{patient.phone || "—"}</MonoText></TableCell>
      <TableCell>
        <Stack direction="row" gap={2}>
          <Button size="sm" variant="ghost" disabled={!patient.phone} onClick={sendRefill}><IconWhatsApp size={14} /> Refill</Button>
          <Button size="sm" variant="ghost" disabled={!patient.phone} title="Lab / follow-up" onClick={sendFollowup}><IconStethoscope size={14} /></Button>
          <Button size="sm" variant="ghost" disabled={!patient.phone} title="SMS" onClick={sendSms}><IconMessage size={14} /></Button>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function ReminderRows({ reminders, now }: { reminders: ReminderLog[]; now: number }) {
  return reminders.map(function renderReminder(reminder) {
    return (
      <Stack key={reminder.id} direction="row" align="center" gap={2} className="border-b border-line py-2 last:border-0">
        <Box className="grid h-8 w-8 place-items-center rounded-md bg-wash text-mid">
          {reminder.kind === "winback" ? <IconHeart size={15} /> : reminder.kind === "followup" ? <IconStethoscope size={15} /> : <IconClock size={15} />}
        </Box>
        <Stack className="min-w-0 flex-1">
          <Text className="font-bold">{reminder.custName}</Text>
          <Text variant="caption">{reminder.kind} · {reminder.channel}</Text>
        </Stack>
        <Text variant="caption">{timeAgo(reminder.at, now)}</Text>
      </Stack>
    );
  });
}
