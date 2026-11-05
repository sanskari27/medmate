import { useState, type ChangeEvent } from "react";
import { inr, timeAgo } from "@/utils";
import { SEGMENTS, segLabel, type Patient, type Segment } from "@/utils/calculations/crm";
import { Box, Input, MonoText, Pill, Select, Stack, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Tag, Text } from "@/components/atoms";
import { IconSearch, IconUser } from "@/components/atoms";
import { Card } from "@/components/molecules/Card";
import type { CrmViewProps } from "@/screens/Crm/Crm.types";
import { availablePoints, filterPatients, segmentMemberCount } from "@/screens/Crm/Crm.utils";

import type { PatientsProps } from "./Patients.types";
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
    <Stack gap={3}>
      <Stack direction="row" align="center" wrap gap={2}>
        <Stack direction="row" align="center" gap={2} className="min-w-[240px] max-w-[360px] flex-1 rounded-sm border border-line-2 bg-paper px-3 py-2">
          <Box className="text-green"><IconSearch size={17} /></Box>
          <Input variant="plain" aria-label="Search patient" placeholder="Search patient…" value={query} onChange={handleQuery} className="py-0 placeholder:text-faint" />
        </Stack>
        <Select className="w-auto" value={segment} onChange={handleSegment} aria-label="Segment" options={[{ value: "all", label: "All segments (" + String(view.patients.length) + ")" }, ...SegmentOptions({patients: view.patients})]} />
      </Stack>
      <Card className="rounded-md shadow-sm">
        <Box className="overflow-x-auto">
          <Table className="border-separate border-spacing-0 [&_tbody_tr:hover]:bg-wash-2 [&_td]:border-b [&_td]:border-line [&_td]:px-3.5 [&_td]:py-[11px] [&_td]:align-middle [&_td]:text-ink-2 [&_td.text-right]:font-semibold [&_td.text-right]:text-ink [&_th]:sticky [&_th]:top-0 [&_th]:border-b [&_th]:border-line [&_th]:bg-wash-2 [&_th]:px-3.5 [&_th]:py-[11px] [&_th]:text-[10.5px] [&_th]:font-bold [&_th]:tracking-[0.07em] [&_th]:whitespace-nowrap [&_th]:text-muted [&_th]:uppercase">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Segments</TableHeaderCell>
                <TableHeaderCell>Tier</TableHeaderCell>
                <TableHeaderCell align="right">Points</TableHeaderCell>
                <TableHeaderCell align="right">RFM</TableHeaderCell>
                <TableHeaderCell align="right">Orders</TableHeaderCell>
                <TableHeaderCell>Last visit</TableHeaderCell>
                <TableHeaderCell align="right">Lifetime</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <PatientRows patients={list} view={view} />
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}><Text className="px-5 py-9 text-center text-[13px] text-muted">No patients in this segment.</Text></TableCell>
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
    return { value: String(segment.key), label: String(segment.label) + " (" + String(segmentMemberCount(patients, segment.key)) + ")" };
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
    <TableRow className="cursor-pointer" onClick={handleOpen}>
      <TableCell>
        <Stack direction="row" align="center" gap={2}>
          <Box className="grid h-8 w-8 place-items-center rounded-md bg-wash text-mid"><IconUser size={15} /></Box>
          <Text className="font-bold">
            {patient.name}
            {patient.chronic ? <Tag className="ml-1.5">chronic</Tag> : null}
          </Text>
        </Stack>
      </TableCell>
      <TableCell><SegmentPills segments={patient.segments} /></TableCell>
      <TableCell><Pill tone="gold">{patient.tier}</Pill></TableCell>
      <TableCell align="right" className="font-bold">{availablePoints(patient, view.redeemedBy)}</TableCell>
      <TableCell align="right">{patient.rfm.score}</TableCell>
      <TableCell align="right">{patient.orders}</TableCell>
      <TableCell>{timeAgo(patient.lastAt, view.now)}</TableCell>
      <TableCell align="right" className="font-extrabold">{inr(patient.spent)}</TableCell>
    </TableRow>
  );
}

function SegmentPills({ segments }: { segments: Segment[] }) {
  return segments.map(function renderPill(segment) {
    return <Pill key={segment} tone="gray" className="mr-1">{segLabel(segment)}</Pill>;
  });
}
