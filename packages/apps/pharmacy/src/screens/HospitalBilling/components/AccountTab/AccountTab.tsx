import type { AccountTabProps } from "./AccountTab.types";
import type { StatementLine } from "@/utils";
import { Box, Button, Heading, Input, Label, Progress, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState, useMemo } from "react";
import { usePharma } from "@/hooks";
import { inr, fmtDateTime } from "@/utils";
import { CreditTerms, CREDIT_TERMS, buildStatement, termDays, hospitalAging, } from "@/utils/calculations/hospitalAccount";
import { IconReports, IconPrint, IconTag, IconAlert, IconSend, IconCheck } from "@/components/atoms";
import { buildReportPdf } from "@/utils/pdf";
import { useDateRange } from "@/components/molecules";
import { download } from "@/screens/HospitalBilling/utils/download";
type LineType = "all" | "issue" | "return" | "payment";
const LINE_FILTERS: {
    k: LineType;
    label: string;
}[] = [
    { k: "all", label: "All" },
    { k: "issue", label: "Supplied" },
    { k: "return", label: "Returns" },
    { k: "payment", label: "Payments" },
];
export function AccountTab({ outstanding, aging, onRemind, }: AccountTabProps) {
    const { hospitalAccount: a, updateHospitalAccount, wardSupplies, hospitalPayments, profile, now, } = usePharma();
    const limit = a.creditLimit || 0;
    const util = limit > 0 ? Math.min(100, Math.round((outstanding / limit) * 100)) : 0;
    const lines = useMemo(() => buildStatement(wardSupplies, hospitalPayments), [wardSupplies, hospitalPayments]);
    const dueDays = termDays(a.creditTerms);
    // standard date-range filter (+ entry-type filter) over the statement
    const period = useDateRange(now, "last-365");
    const [tf, setTf] = useState<LineType>("all");
    const shown = useMemo(() => lines.filter((l) => period.inWindow(l.at) && (tf === "all" || l.type === tf)), [lines, period, tf]);
    const prior = lines.filter((l) => !period.inWindow(l.at) && l.at < (shown[0]?.at ?? Infinity));
    const opening = prior.length ? prior[prior.length - 1].balance : 0;
    const periodDebit = shown.reduce((s, l) => s + l.debit, 0);
    const periodCredit = shown.reduce((s, l) => s + l.credit, 0);
    const closing = shown.length ? shown[shown.length - 1].balance : opening;
    const exportCsv = () => {
        const head = ["Date", "Ref", "Particulars", "Patient ref", "Debit", "Credit", "Balance"];
        const body = shown.map((l) => [
            fmtDateTime(l.at),
            l.ref,
            l.label,
            a.flagRefills && l.patientId ? `${l.patientId} ${l.patientName ?? ""}` : "",
            l.debit || "",
            l.credit || "",
            l.balance,
        ]);
        const rows = [
            ["", "", `Opening balance · ${period.label}`, "", "", "", opening],
            ...body,
            ["", "", "Closing balance", "", periodDebit, periodCredit, closing],
        ];
        const csv = [head, ...rows]
            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        download(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), "hospital-credit-statement.csv");
    };
    const exportPdf = () => {
        const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));
        const headerLine = "Date              Ref       Particulars                    Debit      Credit     Balance";
        const rowLines = [
            `${pad("Opening balance", 57)}${("Rs " + Math.round(opening)).padStart(11)}`,
            ...shown.map((l) => `${pad(fmtDateTime(l.at), 17)} ${pad(l.ref, 9)} ${pad(l.label + (a.flagRefills && l.patientId ? ` [${l.patientId}]` : ""), 30)} ${(l.debit ? "Rs " + Math.round(l.debit) : "").padStart(10)} ${(l.credit ? "Rs " + Math.round(l.credit) : "").padStart(10)} ${("Rs " + Math.round(l.balance)).padStart(11)}`),
        ];
        download(buildReportPdf({
            title: "Hospital Credit Statement",
            subtitle: `${a.name} · ${period.label}${tf !== "all" ? " · " + LINE_FILTERS.find((x) => x.k === tf)!.label : ""} · terms ${a.creditTerms}`,
            generatedAt: fmtDateTime(now),
            profile,
            headerLine,
            rowLines,
            totalsLine: `Period debit Rs ${Math.round(periodDebit)}   credit Rs ${Math.round(periodCredit)}   ·   CLOSING BALANCE Rs ${Math.round(closing)}`,
        }), "hospital-credit-statement.pdf");
    };
    return (<Box className="!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1">
      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
        <Heading className={cn("!text-[15px] !mb-3")} level={3}>Hospital account</Heading>
        <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
            <Label>Hospital / institution name</Label>
            <Input className="" value={a.name} onChange={updateHospitalAccountOnChange}/>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="gstin">
            <Label>GSTIN</Label>
            <Input className="!font-mono" value={a.gstin} onChange={updateHospitalAccountOnChange2}/>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Stores contact</Label>
            <Input className="" value={a.contact} onChange={updateHospitalAccountOnChange3}/>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="phone">
            <Label>Billing phone</Label>
            <Input className="" value={a.phone ?? ""} onChange={updateHospitalAccountOnChange4} placeholder="+91 "/>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Billing email</Label>
            <Input className="" value={a.email ?? ""} onChange={updateHospitalAccountOnChange5}/>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Credit terms</Label>
            <Select className="" value={a.creditTerms} onChange={updateHospitalAccountOnChange6} options={[...(CREDIT_TERMS.map(renderCREDITTERMS))]} />
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Credit limit ₹</Label>
            <Input className="" type="number" min={0} value={a.creditLimit} onChange={updateHospitalAccountOnChange7}/>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
            <Label>Institutional discount</Label>
            <Input value={`${a.discountPct}% off MRP · managed in Price list`} readOnly className={cn("", "!bg-wash-2 !text-muted")}/>
          </Box>
        </Box>
        {/* credit-limit utilisation + aging */}
        {limit > 0 && (<>
            <Progress className="mt-3.5 h-2.5 rounded-[6px]" value={util} tone={util >= 85 ? "rose" : "mid"} label="Credit limit" />
            <Box className="!mt-1.5 !flex !items-center !justify-between !text-xs !text-muted">
              <Text as="span">
                {inr(outstanding)} of {inr(limit)} limit
              </Text>
              <Text as="span" className="font-bold">
                {util}% used · {inr(Math.max(0, limit - outstanding))} free
              </Text>
            </Box>
          </>)}
        <Box className="!text-[12.5px] !text-muted">
          {aging.overdue > 0 ? (<Text className="inline-flex items-center gap-1.5 font-bold text-rose" as="span">
              <IconAlert size={13}/> {inr(aging.overdue)} overdue
              {aging.overdueDays > 0 ? ` · ${aging.overdueDays}d past due` : ""}
            </Text>) : (<Text className="inline-flex items-center gap-1.5 font-bold text-mid" as="span">
              <IconCheck size={13}/> Nothing overdue
            </Text>)}
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 hover:!border-mid hover:!text-mid !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={onRemind}>
            <IconSend size={13}/> Send reminder
          </Button>
        </Box>
        <Box className={cn("!mb-2.5 !flex !items-center !gap-3 !rounded-md !border !border-line !px-3.5 !py-3", "!mt-3")}>
          <Text className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-wash text-mid" as="span">
            <IconTag size={16}/>
          </Text>
          <Box className="min-w-0 flex-1">
            <Box className="text-[13.5px] font-bold text-ink">Flag refill lines on statement</Box>
            <Box className="text-xs text-muted">
              Show the patient ID/name on PATIENT_REFILL lines so the hospital can recover from the
              patient
            </Box>
          </Box>
          <Button className={`!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !bg-[#cddcd3] !p-0 !shadow-none after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow after:!transition after:!content-['']${a.flagRefills ? "!bg-mid after:!translate-x-4" : ""}`} onClick={updateHospitalAccountOnClick}/>
        </Box>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className={cn("!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold", "!flex-wrap !gap-2")}>
          <Box>
            <Heading level={3}>Credit statement</Heading>
            <Text className={cn("!text-muted", "!text-[12px]")} as="span">
              {dueDays ? `Net ${dueDays} days` : "Due on demand"} · {shown.length} entr
              {shown.length === 1 ? "y" : "ies"}
            </Text>
          </Box>
          <Box className="!flex !items-center !gap-1.5">
            <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={exportCsv}>
              <IconReports size={14}/> Excel
            </Button>
            <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={exportPdf}>
              <IconPrint size={14}/> PDF
            </Button>
          </Box>
        </Box>
        {/* standard filter */}
        <Box className={cn("!flex-1 !p-[18px]", "!pt-3 !pb-0 !flex !gap-2 !flex-wrap !items-center")}>
          {period.node}
          <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
            {LINE_FILTERS.map(renderLINEFILTERS)}
          </Box>
        </Box>
        {/* period summary */}
        <Box className={cn("!flex-1 !p-[18px]", "!pt-3 !pb-2")}>
          <Box className="!mb-3.5 !flex !flex-wrap !gap-2.5">
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Opening<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{inr(opening)}</Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Supplied (debit)<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{inr(periodDebit)}</Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Returns + paid (credit)<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{inr(periodCredit)}</Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Closing
              <Text as="span" className={cn("font-bold", "mt-px block font-display text-[15px] font-bold text-dark", closing > 0 ? "!text-rose" : "!text-mid")}>{inr(closing)}</Text>
            </Box>
          </Box>
        </Box>
        <Box className={cn("!overflow-x-auto", "!max-h-[320px] !overflow-y-auto")}>
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Particulars</TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">Debit</TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">Credit</TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">Balance</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...shown].reverse().map(renderL)}
              {shown.length === 0 && (<TableRow>
                  <TableCell colSpan={5}>
                    <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">No transactions in this period.</Box>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>);
    function updateHospitalAccountOnChange(e: ChangeEvent<HTMLInputElement>) {
        return updateHospitalAccount({ name: e.target.value });
    }
    function updateHospitalAccountOnChange2(e: ChangeEvent<HTMLInputElement>) {
        return updateHospitalAccount({ gstin: e.target.value.toUpperCase() });
    }
    function updateHospitalAccountOnChange3(e: ChangeEvent<HTMLInputElement>) {
        return updateHospitalAccount({ contact: e.target.value });
    }
    function updateHospitalAccountOnChange4(e: ChangeEvent<HTMLInputElement>) {
        return updateHospitalAccount({ phone: e.target.value });
    }
    function updateHospitalAccountOnChange5(e: ChangeEvent<HTMLInputElement>) {
        return updateHospitalAccount({ email: e.target.value });
    }
    function updateHospitalAccountOnChange6(e: ChangeEvent<HTMLSelectElement>) {
        return updateHospitalAccount({ creditTerms: e.target.value as CreditTerms });
    }
    function renderCREDITTERMS(t: CreditTerms) {
        return { value: String(t), label: String(t) };
    }
    function updateHospitalAccountOnChange7(e: ChangeEvent<HTMLInputElement>) {
        return updateHospitalAccount({ creditLimit: Math.max(0, Number(e.target.value) || 0) });
    }
    function updateHospitalAccountOnClick() {
        return updateHospitalAccount({ flagRefills: !a.flagRefills });
    }
    function renderLINEFILTERS(x: {
        k: LineType;
        label: string;
    }) {
        return (<Button key={x.k} className={tf === x.k ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"} onClick={setTfOnClick}>
                {x.label}
              </Button>);
        function setTfOnClick() {
            return setTf(x.k);
        }
    }
    function renderL(l: StatementLine, i: number) {
        return (<TableRow key={l.ref + i}>
                  <TableCell className={cn("!whitespace-nowrap")}>
                    {fmtDateTime(l.at)}
                    <Box className={cn("!text-muted !font-mono", "!text-[10.5px]")}>
                      {l.ref}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {l.label}
                    {a.flagRefills && l.patientId && (<Box className={cn("!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-teal-bg !text-teal", "!mt-[3px] !text-[10px]")}>
                        recover from {l.patientId} · {l.patientName}
                      </Box>)}
                  </TableCell>
                  <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">{l.debit ? inr(l.debit) : "—"}</TableCell>
                  <TableCell className={cn("!text-right !tabular-nums !font-semibold !text-ink", "!text-mid")}>
                    {l.credit ? inr(l.credit) : "—"}
                  </TableCell>
                  <TableCell className={cn("!text-right !tabular-nums !font-semibold !text-ink", "!font-extrabold")}>
                    {inr(l.balance)}
                  </TableCell>
                </TableRow>);
    }
}
