import type { ReactNode } from "react";
import { inr, timeAgo } from "@/utils";
import { atRisk, crmMsg, refillsDue, type Patient } from "@/utils/calculations/crm";
import { Box, Button, Heading, MonoText, Pill, Progress, Stack, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { IconAlert, IconCheck, IconClock, IconGift, IconSparkle, IconStar, IconUser, IconWhatsApp } from "@/components/atoms";
import { Card, CardBody } from "@/components/molecules/Card";
import { SegmentIcon } from "@/components/molecules/EntityMark";
import type { CrmViewProps } from "@/screens/Crm/Crm.types";
import { activePatientCount, barShare, feedbackScore, openWhatsApp, outstandingPoints, segmentCounts } from "@/screens/Crm/Crm.utils";

import type { OverviewProps } from "./Overview.types";
export function Overview({ view }: OverviewProps) {
  const dueSoon = refillsDue(view.patients, 7);
  const risk = atRisk(view.patients);
  const points = outstandingPoints(view.patients, view.redeemedBy);
  const score = feedbackScore(view.crm.feedbacks);
  const distribution = segmentCounts(view.patients);
  const maxCount = Math.max(1, ...distribution.map(function count(item) { return item.count; }));

  return (
    <Stack gap={4}>
      <Box className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-4">
        <Stat tone="bg-wash text-mid" icon={<IconUser size={18} />} label="Patients" value={String(view.patients.length)} detail="total on file" />
        <Stat tone="bg-blue-bg text-blue" icon={<IconCheck size={18} />} label="Active (30d)" value={String(activePatientCount(view.patients))} detail="ordered recently" />
        <Stat tone="bg-rose-bg text-rose" icon={<IconAlert size={18} />} label="At-risk" value={String(risk.length)} detail="churn candidates" />
        <Stat tone="bg-amber-bg text-gold-d" icon={<IconClock size={18} />} label="Refills due (7d)" value={String(dueSoon.length)} detail="medicines to reorder" />
        <Stat tone="bg-amber-bg text-gold-d" icon={<IconGift size={18} />} label="Loyalty points" value={points.toLocaleString("en-IN")} detail="redeemable rewards" />
        <Stat tone="bg-wash text-mid" icon={<IconStar size={18} />} label="Avg rating" value={score.average ? score.average.toFixed(1) : "—"} detail="out of 5" />
      </Box>
      <Box className="grid grid-cols-1 gap-4 min-[768px]:grid-cols-[1.5fr_1fr]">
        <Card className="rounded-md shadow-sm">
          <CardHead title="Refills due this week" aside="chronic care" />
          <CardBody className="px-[18px] pb-[18px]">
            {dueSoon.length === 0 ? <Text className="px-4 py-4 text-center text-[13px] text-muted">No refills due in 7 days.</Text> : <RefillRows patients={dueSoon.slice(0, 6)} onOpen={view.openPatient} />}
          </CardBody>
        </Card>
        <Card className="rounded-md shadow-sm">
          <CardHead title="Segment distribution" />
          <CardBody className="px-[18px] pb-[18px]">
            <SegmentBars rows={distribution} maxCount={maxCount} />
          </CardBody>
        </Card>
      </Box>
      <Card className="rounded-md shadow-sm">
        <CardHead title="At-risk / lapsed patients" aside="no purchase in 60+ days" />
        <Box className="overflow-x-auto">
          <Table className="border-separate border-spacing-0 [&_tbody_tr:hover]:bg-wash-2 [&_td]:border-b [&_td]:border-line [&_td]:px-3.5 [&_td]:py-[11px] [&_td]:align-middle [&_td]:text-ink-2 [&_td.text-right]:font-semibold [&_td.text-right]:text-ink [&_th]:sticky [&_th]:top-0 [&_th]:border-b [&_th]:border-line [&_th]:bg-wash-2 [&_th]:px-3.5 [&_th]:py-[11px] [&_th]:text-[10.5px] [&_th]:font-bold [&_th]:tracking-[0.07em] [&_th]:whitespace-nowrap [&_th]:text-muted [&_th]:uppercase">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
                <TableHeaderCell align="right">Orders</TableHeaderCell>
                <TableHeaderCell align="right">Lifetime</TableHeaderCell>
                <TableHeaderCell>Last seen</TableHeaderCell>
                <TableHeaderCell>Win back</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {risk.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Stack align="center" className="px-5 py-9 text-center text-muted">
                      <Box className="mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-mid"><IconSparkle size={30} /></Box>
                      <Text className="text-[13px] text-muted">No at-risk patients — great retention!</Text>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                <RiskRows patients={risk.slice(0, 8)} view={view} />
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Stack>
  );
}

function CardHead({ title, aside }: { title: string; aside?: string }) {
  return (
    <Stack direction="row" align="center" justify="between" className="border-b border-line px-[18px] py-[15px]">
      <Heading level={3} className="text-[15px] font-bold tracking-normal">{title}</Heading>
      {aside ? <Text className="text-[12.5px] text-muted">{aside}</Text> : null}
    </Stack>
  );
}

function Stat({ tone, icon, label, value, detail }: { tone: string; icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <Box className="flex flex-col rounded-md border border-line bg-paper px-[18px] py-4 shadow-sm">
      <Box className={`grid h-8 w-8 place-items-center rounded-[9px] ${tone}`}>{icon}</Box>
      <Text variant="label" className="mt-3 text-[11px] font-bold uppercase tracking-[0.05em] text-muted">{label}</Text>
      <Text className="mt-[3px] mb-2.5 font-display text-[26px] font-extrabold tracking-[-0.03em] text-dark tabular-nums max-[767px]:text-[22px]">{value}</Text>
      <Text variant="caption" className="mt-auto border-t border-line pt-[9px] text-[12px]">{detail}</Text>
    </Box>
  );
}

function RefillRows({ patients, onOpen }: { patients: Patient[]; onOpen: (key: string) => void }) {
  return patients.map(function renderRefill(patient) {
    return <RefillRow key={patient.key} patient={patient} onOpen={onOpen} />;
  });
}

function RefillRow({ patient, onOpen }: { patient: Patient; onOpen: (key: string) => void }) {
  function handleOpen() {
    onOpen(patient.key);
  }
  const daysLeft = patient.refill?.daysLeft ?? 0;
  return (
    <Stack direction="row" align="center" gap={3} className="cursor-pointer border-b border-line py-3 last:border-0" onClick={handleOpen}>
      <Box className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-wash text-mid"><IconClock size={15} /></Box>
      <Stack className="min-w-0 flex-1 gap-0">
        <Text className="text-[13.5px] font-bold text-ink">{patient.name}</Text>
        <Text className="text-[12px] text-muted">{patient.refill?.med}</Text>
      </Stack>
      <Pill tone={daysLeft <= 0 ? "rose" : "gold"}>{daysLeft <= 0 ? "Overdue" : `${daysLeft}d`}</Pill>
    </Stack>
  );
}

function SegmentBars({ rows, maxCount }: { rows: ReturnType<typeof segmentCounts>; maxCount: number }) {
  return rows.map(function renderSegment(row) {
    return (
      <Box key={row.segment.key} className="mb-2.5">
        <Stack direction="row" justify="between" className="mb-1 text-[13px]">
          <Text as="span" className="inline-flex items-center gap-1.5"><SegmentIcon k={row.segment.key} size={14} /> {row.segment.label}</Text>
          <Text as="span" className="font-bold">{row.count}</Text>
        </Stack>
        <Progress className="h-[7px] rounded-[5px]" value={barShare(row.count, maxCount)} />
      </Box>
    );
  });
}

function RiskRows({ patients, view }: { patients: Patient[]; view: CrmViewProps }) {
  return patients.map(function renderRisk(patient) {
    return <RiskRow key={patient.key} patient={patient} view={view} />;
  });
}

function RiskRow({ patient, view }: { patient: Patient; view: CrmViewProps }) {
  function handleOpen() {
    view.openPatient(patient.key);
  }
  function stopRowClick(event: { stopPropagation: () => void }) {
    event.stopPropagation();
  }
  function handleWinBack() {
    openWhatsApp(patient.phone, crmMsg.winback(patient.name, view.profile.name));
    view.logReminder({ custKey: patient.key, custName: patient.name, kind: "winback", channel: "whatsapp" });
  }
  return (
    <TableRow className="cursor-pointer" onClick={handleOpen}>
      <TableCell>
        <Stack direction="row" align="center" gap={2}>
          <Box className="grid h-8 w-8 place-items-center rounded-md bg-wash text-mid"><IconUser size={15} /></Box>
          <Text className="font-bold">{patient.name}</Text>
        </Stack>
      </TableCell>
      <TableCell><MonoText>{patient.phone || "—"}</MonoText></TableCell>
      <TableCell align="right">{patient.orders}</TableCell>
      <TableCell align="right">{inr(patient.spent)}</TableCell>
      <TableCell>{timeAgo(patient.lastAt, view.now)}</TableCell>
      <TableCell onClick={stopRowClick}>
        <Button variant="ghost" size="sm" disabled={!patient.phone} onClick={handleWinBack}><IconWhatsApp size={14} /> Win back</Button>
      </TableCell>
    </TableRow>
  );
}
