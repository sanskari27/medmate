import type { ReactNode } from "react";
import { inr, timeAgo } from "@/utils";
import { atRisk, crmMsg, refillsDue, type Patient } from "@/utils/calculations/crm";
import { Box, Button, MonoText, Pill, Progress, Stack, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { IconAlert, IconCheck, IconClock, IconGift, IconStar, IconUser, IconWhatsApp } from "@/components/atoms";
import { Card, CardBody, CardHeader } from "@/components/molecules/Card";
import { EmptyState } from "@/components/molecules/EmptyState";
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
      <Box className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Refills due this week" subtitle="chronic care" />
          <CardBody>
            {dueSoon.length === 0 ? <EmptyState title="No refills due in 7 days." className="py-4" /> : <RefillRows patients={dueSoon.slice(0, 6)} onOpen={view.openPatient} />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Segment distribution" />
          <CardBody>
            <SegmentBars rows={distribution} maxCount={maxCount} />
          </CardBody>
        </Card>
      </Box>
      <Card>
        <CardHeader title="At-risk / lapsed patients" subtitle="no purchase in 60+ days" />
        <Box className="overflow-x-auto">
          <Table>
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
                    <EmptyState title="No at-risk patients — great retention!" />
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

function Stat({ tone, icon, label, value, detail }: { tone: string; icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <Box className="flex flex-col rounded-lg border border-line bg-paper px-[18px] py-4 shadow-sm">
      <Box className={`grid h-8 w-8 place-items-center rounded-[9px] ${tone}`}>{icon}</Box>
      <Text variant="label" className="mt-3 text-[11px] uppercase tracking-[0.05em]">{label}</Text>
      <Text className="mt-[3px] mb-2.5 font-display text-[26px] font-extrabold tracking-[-0.03em] text-dark tabular-nums">{value}</Text>
      <Text variant="caption" className="border-t border-line pt-[9px] text-[12px]">{detail}</Text>
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
    <Stack direction="row" align="center" gap={2} className="cursor-pointer border-b border-line py-2 last:border-0" onClick={handleOpen}>
      <Box className="grid h-8 w-8 place-items-center rounded-md bg-wash text-mid"><IconClock size={15} /></Box>
      <Stack className="min-w-0 flex-1">
        <Text className="font-bold">{patient.name}</Text>
        <Text variant="caption">{patient.refill?.med}</Text>
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
        <Progress value={barShare(row.count, maxCount)} />
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
