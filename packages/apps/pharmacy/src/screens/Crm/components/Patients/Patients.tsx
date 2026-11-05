import { useState, type ChangeEvent } from "react";
import { inr, timeAgo } from "@/utils";
import { SEGMENTS, segLabel, type Patient, type Segment } from "@/utils/calculations/crm";
import {
  Box,
  Input,
  Pill,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  Text,
} from "@/components/atoms";
import { IconSearch, IconUser } from "@/components/atoms";
import { Card } from "@/components/molecules/Card";
import type { CrmViewProps } from "@/screens/Crm/Crm.types";
import { availablePoints, filterPatients, segmentMemberCount } from "@/screens/Crm/Crm.utils";

import type { PatientsProps } from "./Patients.types";

const card = "!rounded-md !shadow-sm";
const crmTable =
  "!border-separate border-spacing-0 text-[13px] [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-100 [&_tbody_tr:hover]:bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0";
const th =
  "!sticky !top-0 z-[1] !border-b !border-line !bg-wash-2 !px-3.5 !py-[11px] !text-[10.5px] !font-bold !uppercase !tracking-[0.07em] !whitespace-nowrap !text-muted";
const td = "!border-b !border-line !px-3.5 !py-[11px] align-middle !text-ink-2";
const num = `${td} !text-right !tabular-nums !text-ink`;

export function Patients({ view }: PatientsProps) {
  const [segment, setSegment] = useState<Segment | "all">("all");
  const [query, setQuery] = useState("");
  const list = filterPatients(view.patients, segment, query);

  function handleQuery(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function handleSegment(event: ChangeEvent<HTMLSelectElement>) {
    setSegment(event.target.value as Segment | "all");
  }

  return (
    <Stack gap={0}>
      <Stack direction="row" align="center" wrap className="mb-4 gap-[10px]">
        <Stack
          direction="row"
          align="center"
          gap={2}
          className="min-w-[240px] max-w-[360px] flex-1 rounded-sm border border-line-2 bg-paper px-3 py-2 max-[767px]:max-w-none max-[767px]:min-w-0 max-[767px]:flex-[1_1_100%]"
        >
          <Box className="text-green">
            <IconSearch size={17} />
          </Box>
          <Input
            variant="plain"
            aria-label="Search patient"
            placeholder="Search patient…"
            value={query}
            onChange={handleQuery}
            className="!py-0 placeholder:text-faint"
          />
        </Stack>
        <Select
          className="!w-[180px] max-w-full max-[767px]:!w-auto max-[767px]:flex-[1_1_140px]"
          value={segment}
          onChange={handleSegment}
          aria-label="Segment"
          options={[
            { value: "all", label: "All segments (" + String(view.patients.length) + ")" },
            ...SegmentOptions({ patients: view.patients }),
          ]}
        />
      </Stack>
      <Card className={card}>
        <Box className="overflow-x-auto">
          <Table className={crmTable}>
            <TableHead>
              <TableRow className="!border-0">
                <TableHeaderCell className={th}>Patient</TableHeaderCell>
                <TableHeaderCell className={th}>Segments</TableHeaderCell>
                <TableHeaderCell className={th}>Tier</TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  Points
                </TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  RFM
                </TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  Orders
                </TableHeaderCell>
                <TableHeaderCell className={th}>Last visit</TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  Lifetime
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <PatientRows patients={list} view={view} />
              {list.length === 0 ? (
                <TableRow className="!border-0">
                  <TableCell colSpan={8} className={td}>
                    <Stack align="center" className="px-5 py-9 text-center text-muted">
                      <Box className="mb-3 grid h-11 w-11 place-items-center overflow-hidden rounded-md bg-wash text-mid">
                        <IconSearch size={30} />
                      </Box>
                      <Text className="mx-auto max-w-[340px] !text-[13px] !text-muted">
                        No patients in this segment.
                      </Text>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Stack>
  );
}

function SegmentOptions({ patients }: { patients: Patient[] }) {
  return SEGMENTS.map(function renderOption(segment) {
    return {
      value: String(segment.key),
      label: String(segment.label) + " (" + String(segmentMemberCount(patients, segment.key)) + ")",
    };
  });
}

function PatientRows({ patients, view }: { patients: Patient[]; view: CrmViewProps }) {
  return patients.map(function renderPatient(patient) {
    return <PatientRow key={patient.key} patient={patient} view={view} />;
  });
}

function PatientRow({ patient, view }: { patient: Patient; view: CrmViewProps }) {
  function handleOpen() {
    view.openPatient(patient.key);
  }
  return (
    <TableRow className="!border-0 cursor-pointer" onClick={handleOpen}>
      <TableCell className={td}>
        <Stack direction="row" align="center" gap={0} className="gap-2.5">
          <Box className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-mid">
            <IconUser size={15} />
          </Box>
          <Text className="!font-bold !text-ink">
            {patient.name}
            {patient.chronic ? <Tag className="ml-1.5">chronic</Tag> : null}
          </Text>
        </Stack>
      </TableCell>
      <TableCell className={td}>
        <SegmentPills segments={patient.segments} />
      </TableCell>
      <TableCell className={td}>
        <Pill tone="gold">{patient.tier}</Pill>
      </TableCell>
      <TableCell align="right" className={`${num} !font-bold`}>
        {availablePoints(patient, view.redeemedBy)}
      </TableCell>
      <TableCell align="right" className={`${num} !font-semibold`}>
        {patient.rfm.score}
      </TableCell>
      <TableCell align="right" className={`${num} !font-semibold`}>
        {patient.orders}
      </TableCell>
      <TableCell className={td}>{timeAgo(patient.lastAt, view.now)}</TableCell>
      <TableCell align="right" className={`${num} !font-extrabold`}>
        {inr(patient.spent)}
      </TableCell>
    </TableRow>
  );
}

function SegmentPills({ segments }: { segments: Segment[] }) {
  return segments.map(function renderPill(segment) {
    return (
      <Pill key={segment} tone="gray" className="mr-1 !text-[11px]">
        {segLabel(segment)}
      </Pill>
    );
  });
}
