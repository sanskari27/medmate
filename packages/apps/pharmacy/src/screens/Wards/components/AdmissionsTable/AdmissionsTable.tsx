import type { AdmissionsTableProps } from "./AdmissionsTable.types";
import { Box, Heading, Input, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { inr, timeAgo, Sale } from "@/utils";
import { Admission } from "@/utils/calculations/hospital";
import { IconSearch, IconArrowRight } from "@/components/Icon";
import { billTotal } from "@/screens/Wards/utils/billTotal";
import { daysIn } from "@/screens/Wards/utils/daysIn";
export function AdmissionsTable({ admissions, sales, now, onOpen, }: AdmissionsTableProps) {
    const [q, setQ] = useState("");
    const rows = admissions.filter((a) => !q.trim() ||
        `${a.name} ${a.patientId} ${a.bed} ${a.wardName} ${a.doctor}`
            .toLowerCase()
            .includes(q.toLowerCase()));
    const outstandingOf = (a: Admission) => sales
        .filter((s) => s.patientId === a.patientId && s.status !== "cancelled" && s.paid === false)
        .reduce((x, s) => x + billTotal(s), 0);
    return (<Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm", "!mt-4")}>
      <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
        <Heading level={3}>Admitted patients</Heading>
        <Box className="!flex !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none">
          <Text className="!text-green" as="span">
            <IconSearch size={16}/>
          </Text>
          <Input placeholder="Patient, UHID, bed…" value={q} onChange={setQOnChange}/>
        </Box>
      </Box>
      <Box className="!overflow-x-auto">
        <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Patient</TableHeaderCell>
              <TableHeaderCell>UHID</TableHeaderCell>
              <TableHeaderCell>Ward · Bed</TableHeaderCell>
              <TableHeaderCell>Doctor</TableHeaderCell>
              <TableHeaderCell>Payer</TableHeaderCell>
              <TableHeaderCell>Admitted</TableHeaderCell>
              <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Outstanding</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(renderRow)}
            {rows.length === 0 && (<TableRow>
                <TableCell colSpan={8}>
                  <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">No admitted patients.</Box>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </Box>
    </Box>);
    function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setQ(e.target.value);
    }
    function renderRow(a: Admission) {
        return (<TableRow key={a.id} onClick={onOpenOnClick} className={cn("!cursor-pointer")}>
                <TableCell>
                  <Text as="span" className="font-bold">{a.name}</Text>
                  <Box className={cn("!text-muted", "!text-[11px]")}>
                    {a.gender}
                    {a.age ? ` · ${a.age}y` : ""}
                  </Box>
                </TableCell>
                <TableCell className="!font-mono">{a.patientId}</TableCell>
                <TableCell>
                  {a.wardName}
                  <Box className={cn("!text-muted !font-mono", "!text-[11px]")}>
                    {a.bed}
                  </Box>
                </TableCell>
                <TableCell>{a.doctor || "—"}</TableCell>
                <TableCell>
                  {a.payerType === "insurance" ? (<Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-blue-bg !text-blue" as="span">{a.insurer ?? "Insurance"}</Text>) : (<Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-gray-pill !text-muted" as="span">Self-pay</Text>)}
                </TableCell>
                <TableCell className={cn("!whitespace-nowrap")}>
                  {daysIn(a.admittedAt, now)}d · {timeAgo(a.admittedAt, now)}
                </TableCell>
                <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-extrabold", outstandingOf(a) > 0 ? "!text-rose" : "!text-mid")}>
                  {inr(outstandingOf(a))}
                </TableCell>
                <TableCell>
                  <IconArrowRight size={15}/>
                </TableCell>
              </TableRow>);
        function onOpenOnClick() {
            return onOpen(a.id);
        }
    }
}
