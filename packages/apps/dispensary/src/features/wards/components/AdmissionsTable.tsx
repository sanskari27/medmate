import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Heading } from "@/components/ui/Heading";
import { IconArrowRight, IconSearch } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import { daysIn, inr, moneyDue, timeAgo, type Admission } from "../model";

export function AdmissionsTable({
  admissions,
  now,
  onOpen,
}: {
  admissions: Admission[];
  now: number;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = admissions.filter((row) => {
    if (!needle) return true;
    return `${row.name} ${row.uhid} ${row.bed} ${row.wardName} ${row.doctor ?? ""}`
      .toLowerCase()
      .includes(needle);
  });

  return (
    <Box className="mt-4 flex flex-col rounded-md border border-line bg-paper shadow-sm">
      <Stack
        direction="row"
        align="center"
        justify="between"
        wrap
        className="gap-2.5 border-b border-line px-[18px] py-[15px]"
      >
        <Heading level={3} className="text-[15px]">
          Admitted patients
        </Heading>
        <Stack
          direction="row"
          align="center"
          className="min-w-[240px] max-w-[360px] flex-1 gap-2 rounded-sm border border-line-2 bg-paper px-3 py-2"
        >
          <Text className="text-green" as="span">
            <IconSearch size={16} />
          </Text>
          <Input
            variant="plain"
            placeholder="Patient, UHID, bed…"
            aria-label="Search admissions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="!py-0"
          />
        </Stack>
      </Stack>
      <Box className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              {[
                "Patient",
                "UHID",
                "Ward · Bed",
                "Doctor",
                "Payer",
                "Admitted",
                "Outstanding",
                "",
              ].map((heading) => (
                <th
                  key={heading || "open"}
                  className={cn(
                    "sticky top-0 border-b border-line bg-wash-2 px-3.5 py-[11px] text-[10.5px] font-bold tracking-[0.07em] whitespace-nowrap text-muted uppercase",
                    heading === "Outstanding" ? "text-right" : "text-left",
                  )}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer hover:bg-wash-2"
                onClick={() => onOpen(row.id)}
              >
                <td className="border-b border-line px-3.5 py-[11px]">
                  <Text as="span" className="font-bold">
                    {row.name}
                  </Text>
                  <Box className="text-[11px] text-muted">
                    {row.gender}
                    {row.age ? ` · ${row.age}y` : ""}
                  </Box>
                </td>
                <td className="border-b border-line px-3.5 py-[11px] font-mono">{row.uhid}</td>
                <td className="border-b border-line px-3.5 py-[11px]">
                  {row.wardName}
                  <Box className="font-mono text-[11px] text-muted">{row.bed}</Box>
                </td>
                <td className="border-b border-line px-3.5 py-[11px]">{row.doctor || "—"}</td>
                <td className="border-b border-line px-3.5 py-[11px]">
                  {row.payerType === "insurance" ? (
                    <Text
                      as="span"
                      className="inline-flex rounded-full bg-blue-bg px-[9px] py-[3px] text-[11px] font-bold text-blue"
                    >
                      {row.insurer ?? "Insurance"}
                    </Text>
                  ) : (
                    <Text
                      as="span"
                      className="inline-flex rounded-full bg-gray-pill px-[9px] py-[3px] text-[11px] font-bold text-muted"
                    >
                      Self-pay
                    </Text>
                  )}
                </td>
                <td className="border-b border-line px-3.5 py-[11px] whitespace-nowrap">
                  {daysIn(row.admittedAt, now)}d · {timeAgo(row.admittedAt, now)}
                </td>
                <td
                  className={cn(
                    "border-b border-line px-3.5 py-[11px] text-right font-extrabold tabular-nums",
                    moneyDue(row.outstanding) ? "text-rose" : "text-mid",
                  )}
                >
                  {inr(row.outstanding)}
                </td>
                <td className="border-b border-line px-3.5 py-[11px]">
                  <IconArrowRight size={15} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-9 text-center text-muted">
                  No admitted patients.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}
