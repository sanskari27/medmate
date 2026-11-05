import type { ReactNode } from "react";
import { inr } from "@/utils";
import { atRisk, segLabel, type Patient } from "@/utils/calculations/crm";
import { Box, Pill, Stack, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { IconMega, IconRefresh, IconRupee, IconStar, IconTrendDown, IconUser } from "@/components/atoms";
import { Card, CardHeader } from "@/components/molecules/Card";
import type { CrmViewProps } from "@/screens/Crm/Crm.types";
import { averageLifetimeValue, campaignRevenue, retentionPercent, topPatientsByRfm } from "@/screens/Crm/Crm.utils";

import type { AnalyticsProps } from "./Analytics.types";
export function Analytics({ view }: AnalyticsProps) {
  const leaders = topPatientsByRfm(view.patients);
  const risk = atRisk(view.patients);
  return (
    <Stack gap={4}>
      <Box className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-4">
        <Stat tone="bg-wash text-mid" icon={<IconRupee size={18} />} label="Avg lifetime value" value={inr(averageLifetimeValue(view.patients))} detail="per patient" />
        <Stat tone="bg-blue-bg text-blue" icon={<IconRefresh size={18} />} label="Retention (repeat)" value={`${retentionPercent(view.patients)}%`} detail="came back" />
        <Stat tone="bg-rose-bg text-rose" icon={<IconTrendDown size={18} />} label="Churn risk" value={String(risk.length)} detail="at-risk patients" />
        <Stat tone="bg-amber-bg text-gold-d" icon={<IconMega size={18} />} label="Campaign sales" value={inr(campaignRevenue(view.crm.campaigns, view.patients, view.sales))} detail="attributed revenue" />
        <Stat tone="bg-blue-bg text-blue" icon={<IconStar size={18} />} label="RFM leaders" value={String(leaders.length)} detail="best customers" />
      </Box>
      <Card>
        <CardHeader title="Top patients by RFM" subtitle="recency · frequency · monetary" />
        <Box className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell align="right">R</TableHeaderCell>
                <TableHeaderCell align="right">F</TableHeaderCell>
                <TableHeaderCell align="right">M</TableHeaderCell>
                <TableHeaderCell align="right">RFM</TableHeaderCell>
                <TableHeaderCell align="right">Orders</TableHeaderCell>
                <TableHeaderCell align="right">Lifetime</TableHeaderCell>
                <TableHeaderCell>Segments</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <LeaderRows patients={leaders} onOpen={view.openPatient} />
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

function LeaderRows({ patients, onOpen }: { patients: Patient[]; onOpen: (key: string) => void }) {
  return patients.map(function renderLeader(patient) {
    return <LeaderRow key={patient.key} patient={patient} onOpen={onOpen} />;
  });
}

function LeaderRow({ patient, onOpen }: { patient: Patient; onOpen: (key: string) => void }) {
  function handleOpen() {
    onOpen(patient.key);
  }
  return (
    <TableRow className="cursor-pointer" onClick={handleOpen}>
      <TableCell>
        <Stack direction="row" align="center" gap={2}>
          <Box className="grid h-8 w-8 place-items-center rounded-md bg-wash text-mid"><IconUser size={15} /></Box>
          <Text className="font-bold">{patient.name}</Text>
        </Stack>
      </TableCell>
      <TableCell align="right">{patient.rfm.r}</TableCell>
      <TableCell align="right">{patient.rfm.f}</TableCell>
      <TableCell align="right">{patient.rfm.m}</TableCell>
      <TableCell align="right"><Pill tone="green">{patient.rfm.score}</Pill></TableCell>
      <TableCell align="right">{patient.orders}</TableCell>
      <TableCell align="right" className="font-extrabold">{inr(patient.spent)}</TableCell>
      <TableCell>{patient.segments.map(segLabel).join(", ")}</TableCell>
    </TableRow>
  );
}
