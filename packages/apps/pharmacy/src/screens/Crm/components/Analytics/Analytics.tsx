import type { ReactNode } from "react";
import { inr } from "@/utils";
import { atRisk, segLabel, type Patient } from "@/utils/calculations/crm";
import {
  Box,
  Heading,
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
  IconMega,
  IconRefresh,
  IconRupee,
  IconStar,
  IconTrendDown,
  IconUser,
} from "@/components/atoms";
import { Card } from "@/components/molecules/Card";
import {
  averageLifetimeValue,
  campaignRevenue,
  retentionPercent,
  topPatientsByRfm,
} from "@/screens/Crm/Crm.utils";

import type { AnalyticsProps } from "./Analytics.types";

const card = "!rounded-md !shadow-sm";
const crmTable =
  "!border-separate border-spacing-0 text-[13px] [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-100 [&_tbody_tr:hover]:bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0";
const th =
  "!sticky !top-0 z-[1] !border-b !border-line !bg-wash-2 !px-3.5 !py-[11px] !text-[10.5px] !font-bold !uppercase !tracking-[0.07em] !whitespace-nowrap !text-muted";
const td = "!border-b !border-line !px-3.5 !py-[11px] align-middle !text-ink-2";
const num = `${td} !text-right !tabular-nums !text-ink`;

export function Analytics({ view }: AnalyticsProps) {
  const leaders = topPatientsByRfm(view.patients);
  const risk = atRisk(view.patients);
  return (
    <Stack gap={0}>
      <Box className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-4">
        <Stat
          tone="bg-wash text-mid"
          icon={<IconRupee size={18} />}
          label="Avg lifetime value"
          value={inr(averageLifetimeValue(view.patients))}
          detail="per patient"
        />
        <Stat
          tone="bg-blue-bg text-blue"
          icon={<IconRefresh size={18} />}
          label="Retention (repeat)"
          value={`${retentionPercent(view.patients)}%`}
          detail="came back"
        />
        <Stat
          tone="bg-rose-bg text-rose"
          icon={<IconTrendDown size={18} />}
          label="Churn risk"
          value={String(risk.length)}
          detail="at-risk patients"
        />
        <Stat
          tone="bg-amber-bg text-gold-d"
          icon={<IconMega size={18} />}
          label="Campaign sales"
          value={inr(campaignRevenue(view.crm.campaigns, view.patients, view.sales))}
          detail="attributed revenue"
        />
        <Stat
          tone="bg-blue-bg text-blue"
          icon={<IconStar size={18} />}
          label="RFM leaders"
          value={String(leaders.length)}
          detail="best customers"
        />
      </Box>
      <Card className={card}>
        <Stack
          direction="row"
          align="center"
          justify="between"
          wrap
          className="gap-2.5 border-b border-line px-[18px] py-[15px]"
        >
          <Heading level={3} className="!text-[15px] !font-bold !tracking-normal">
            Top patients by RFM
          </Heading>
          <Text className="!text-[12.5px] !text-muted">recency · frequency · monetary</Text>
        </Stack>
        <Box className="overflow-x-auto">
          <Table className={crmTable}>
            <TableHead>
              <TableRow className="!border-0">
                <TableHeaderCell className={th}>Patient</TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  R
                </TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  F
                </TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  M
                </TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  RFM
                </TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  Orders
                </TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  Lifetime
                </TableHeaderCell>
                <TableHeaderCell className={th}>Segments</TableHeaderCell>
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

function Stat({
  tone,
  icon,
  label,
  value,
  detail,
}: {
  tone: string;
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Box className="flex h-full flex-col overflow-hidden rounded-md border border-line bg-paper px-[18px] py-4 shadow-sm">
      <Box className={`grid h-8 w-8 place-items-center rounded-[9px] ${tone}`}>{icon}</Box>
      <Text
        variant="label"
        className="mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted"
      >
        {label}
      </Text>
      <Text className="mt-[3px] mb-2.5 font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark tabular-nums max-[767px]:!text-[22px]">
        {value}
      </Text>
      <Text
        variant="caption"
        className="mt-auto border-t border-line pt-[9px] !text-[12px] !text-muted"
      >
        {detail}
      </Text>
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
    <TableRow className="!border-0 cursor-pointer" onClick={handleOpen}>
      <TableCell className={td}>
        <Stack direction="row" align="center" gap={0} className="gap-2.5">
          <Box className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-mid">
            <IconUser size={15} />
          </Box>
          <Text className="!font-bold !text-ink">{patient.name}</Text>
        </Stack>
      </TableCell>
      <TableCell align="right" className={`${num} !font-semibold`}>
        {patient.rfm.r}
      </TableCell>
      <TableCell align="right" className={`${num} !font-semibold`}>
        {patient.rfm.f}
      </TableCell>
      <TableCell align="right" className={`${num} !font-semibold`}>
        {patient.rfm.m}
      </TableCell>
      <TableCell align="right" className={`${num} !font-semibold`}>
        <Pill tone="green">{patient.rfm.score}</Pill>
      </TableCell>
      <TableCell align="right" className={`${num} !font-semibold`}>
        {patient.orders}
      </TableCell>
      <TableCell align="right" className={`${num} !font-extrabold`}>
        {inr(patient.spent)}
      </TableCell>
      <TableCell className={td}>{patient.segments.map(segLabel).join(", ")}</TableCell>
    </TableRow>
  );
}
