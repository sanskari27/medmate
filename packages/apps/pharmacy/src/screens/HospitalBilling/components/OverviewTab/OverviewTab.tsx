import type { OverviewTabProps } from "./OverviewTab.types";
import type { AgingBucket, MonthFlow, SuppliedItem, WardConsumption } from "@/utils";
import { Box, Button, Progress, Table, TableBody, TableCell, TableRow, Text } from "@/components/atoms";
import { BarChart } from "@/components/molecules/BarChart";
import { cn } from "@/utils/className";
import { useMemo } from "react";
import { usePharma } from "@/hooks";
import { inr, timeAgo } from "@/utils";
import { hospitalAging, wardConsumption, topSuppliedItems, monthlyHospitalFlow, } from "@/utils/calculations/hospitalAccount";
import { IconRupee, IconHospital, IconReceipt, IconArrowRight, IconAlert, IconChart, IconSend, IconWallet, IconBox, IconCalendar, IconCheck, IconStore, } from "@/components/atoms";
import { fmtDay } from "@/utils/date";
import { IconClockLite } from "@/screens/HospitalBilling/components/IconClockLite";
type Tab = "overview" | "issue" | "stock" | "account" | "prices";
export function OverviewTab({ outstanding, supplied, returns, received, aging, goTab, onRecordPayment, onRemind, }: OverviewTabProps) {
    const { wardSupplies, hospitalPayments, hospitalAccount: a, wards, now } = usePharma();
    function kpiKey(fn: () => void) {
        return function onKpiKey(event: React.KeyboardEvent) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fn();
            }
        };
    }
    function openIssues() {
        goTab("issue");
    }
    function openStock() {
        goTab("stock");
    }
    const issues = wardSupplies.filter((s) => s.kind === "issue");
    const wardCons = useMemo(() => wardConsumption(wardSupplies), [wardSupplies]);
    const topItems = useMemo(() => topSuppliedItems(wardSupplies, 6), [wardSupplies]);
    const flow = useMemo(() => monthlyHospitalFlow(wardSupplies, hospitalPayments, now, 6), [wardSupplies, hospitalPayments, now]);
    const avgIssue = issues.length ? supplied / issues.length : 0;
    const limit = a.creditLimit || 0;
    const util = limit > 0 ? Math.min(100, Math.round((outstanding / limit) * 100)) : 0;
    const available = Math.max(0, limit - outstanding);
    const near = limit > 0 && util >= 85;
    const activeWards = new Set(issues.map((s) => s.wardId)).size;
    const agingMax = Math.max(1, ...aging.buckets.map((b) => b.amount));
    const activity = useMemo(() => [
        ...wardSupplies.map((s) => ({
            at: s.at,
            kind: s.kind as string,
            label: `${s.kind === "return" ? "Return from" : "Issued to"} ${s.wardName}`,
            amount: s.total,
            sign: s.kind === "return" ? -1 : 1,
            ref: s.id,
        })),
        ...hospitalPayments.map((p) => ({
            at: p.at,
            kind: "payment",
            label: `Payment received${p.ref ? " · " + p.ref : ""}`,
            amount: p.amount,
            sign: -1,
            ref: p.id,
        })),
    ]
        .sort((x, y) => y.at - x.at)
        .slice(0, 6), [wardSupplies, hospitalPayments]);
    return (<>
      {/* credit position + aging */}
      <Box className={cn("!grid !grid-cols-2 !gap-3 max-[767px]:!grid-cols-1", "!mb-4")}>
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          <Box className="!mb-2.5 !flex !items-center !justify-between">
            <IconWallet size={15}/> Credit position
          </Box>
          <Box className="!font-bold !text-ink">
            <Text as="span">Hospital owes</Text>
            <Text as="span" className={cn("font-bold", outstanding > 0 ? "!text-rose" : "!text-mid")}>
              {inr(outstanding)}
            </Text>
          </Box>
          {limit > 0 ? (<>
              <Progress className="h-2.5 rounded-[6px]" value={util} tone={near ? "rose" : "mid"} label="Credit limit" />
              <Box className="!mt-1.5 !flex !items-center !justify-between !text-xs !text-muted">
                <Text as="span">
                  {inr(outstanding)} of {inr(limit)} limit
                </Text>
                <Text as="span" className="font-bold">{util}% used</Text>
              </Box>
              <Box className="!mt-1.5 !flex !items-center !justify-between !text-xs !text-muted">
                <Text as="span">Available credit</Text>
                <Text as="span" className={cn("font-bold", "!text-mid")}>{inr(available)}</Text>
              </Box>
              {near && (<Box className={cn("!text-[12px] !font-bold !text-rose", "!mt-2")}>
                  <IconAlert size={12}/> Credit limit almost reached — collect a payment before
                  issuing more.
                </Box>)}
            </>) : (<Text className={cn("!text-muted", "!text-[12.5px]")}>
              No credit limit set — add one in Account &amp; statement.
            </Text>)}
          <Box className="!text-[12px] !text-muted">
            <Box>
              <Text as="span">Supplied</Text>
              <Text as="span" className="font-bold">{inr(supplied)}</Text>
            </Box>
            <Box>
              <Text as="span">Returns</Text>
              <Text as="span" className="font-bold">{inr(returns)}</Text>
            </Box>
            <Box>
              <Text as="span">Received</Text>
              <Text as="span" className="font-bold">{inr(received)}</Text>
            </Box>
          </Box>
        </Box>

        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          <Box className="!mb-2.5 !flex !items-center !justify-between">
            <IconCalendar size={15}/> Ageing of outstanding
            <Button onClick={onRemind} className={cn("!border !border-line-2 !bg-paper !text-ink-2 hover:!border-mid hover:!text-mid !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs", "!ml-auto")}>
              <IconSend size={13}/> Send reminder
            </Button>
          </Box>
          {aging.overdue > 0 ? (<Box className="!font-bold !text-rose">
              <IconAlert size={14}/> <Text as="span" className="font-bold">{inr(aging.overdue)}</Text> overdue
              {aging.overdueDays > 0 ? ` · oldest ${aging.overdueDays} days past due` : ""}
              {aging.dueDate ? ` (due ${fmtDay(aging.dueDate)})` : ""}
            </Box>) : (<Box className="!text-[12px] !text-muted">
              <IconCheck size={14}/> Nothing overdue — all within{" "}
              {a.creditTerms === "On demand" ? "terms" : a.creditTerms}
            </Box>)}
          <Box className="!flex !h-4 !overflow-hidden !rounded-full">
            {aging.buckets.map(renderBucket)}
          </Box>
        </Box>
      </Box>

      {/* KPIs */}
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid" role="button" tabIndex={0} onClick={goTabOnClick} onKeyDown={kpiKey(openIssues)} title="Ward issues log">
          <Text className="pointer-events-none absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" as="span">
            <IconArrowRight size={16}/>
          </Text>
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconReceipt size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Ward issues</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{issues.length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">billed to hospital</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
            <IconRupee size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Supplied value</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr(supplied)}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">gross, all time</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid" role="button" tabIndex={0} onClick={onRecordPayment} onKeyDown={kpiKey(onRecordPayment)} title="Record a payment">
          <Text className="pointer-events-none absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" as="span">
            <IconArrowRight size={16}/>
          </Text>
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconWallet size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Payments received</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr(received)}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">click to record</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
            <IconArrowRight size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Avg issue value</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr(avgIssue)}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">per ward issue</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid" role="button" tabIndex={0} onClick={goTabOnClick2} onKeyDown={kpiKey(openStock)} title="Ward stock on hand">
          <Text className="pointer-events-none absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" as="span">
            <IconArrowRight size={16}/>
          </Text>
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-teal-bg !text-teal">
            <IconStore size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Active wards</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{activeWards}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">of {wards.length} total</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-rose-bg !text-rose">
            <IconAlert size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Overdue</Box>
          <Box className={cn("!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums", aging.overdue > 0 && "!text-rose")}>
            {inr(aging.overdue)}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            {aging.overdueDays > 0 ? `${aging.overdueDays} days past due` : "on track"}
          </Box>
        </Box>
      </Box>

      {/* leaderboards */}
      <Box className={cn("!grid !grid-cols-2 !gap-3 max-[767px]:!grid-cols-1", "!mt-4")}>
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          <Box className="!mb-2.5 !flex !items-center !justify-between">
            <IconHospital size={15}/> Consumption by ward
            <Button onClick={goTabOnClick3} className={cn("!border !border-line-2 !bg-paper !text-ink-2 hover:!border-mid hover:!text-mid !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs", "!ml-auto")}>
              Ward stock <IconArrowRight size={13}/>
            </Button>
          </Box>
          {wardCons.length === 0 ? (<Text className={cn("!text-muted", "!text-[12.5px]")}>
              No ward issues yet.
            </Text>) : (wardCons.slice(0, 5).map(renderW))}
        </Box>
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          <Box className="!mb-2.5 !flex !items-center !justify-between">
            <IconBox size={15}/> Top medicines supplied
          </Box>
          {topItems.length === 0 ? (<Text className={cn("!text-muted", "!text-[12.5px]")}>
              No data yet.
            </Text>) : (<Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2 !w-full !text-[13px]">
              <TableBody>
                {topItems.map(renderTopItem)}
              </TableBody>
            </Table>)}
        </Box>
      </Box>

      {/* monthly flow + recent activity */}
      <Box className={cn("!grid !grid-cols-2 !gap-3 max-[767px]:!grid-cols-1", "!mt-4")}>
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          <Box className="!mb-2.5 !flex !items-center !justify-between">
            <IconChart size={15}/> Supplied vs received · 6 months
          </Box>
          <BarChart className="h-40" columns={flowColumns()} />
          <Box className={cn("!flex !flex-wrap !gap-2 !text-[12px]", "!mt-1")}>
            <Text as="span">
              <Box className={cn("!bg-mid")} /> Supplied
            </Text>
            <Text as="span">
              <Box className={cn("!bg-[#8a6ee0]")} /> Received
            </Text>
          </Box>
        </Box>
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          <Box className="!mb-2.5 !flex !items-center !justify-between">
            <IconClockLite /> Recent activity
            <Button onClick={goTabOnClick4} className={cn("!border !border-line-2 !bg-paper !text-ink-2 hover:!border-mid hover:!text-mid !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs", "!ml-auto")}>
              Statement <IconArrowRight size={13}/>
            </Button>
          </Box>
          <Box className="!flex !flex-wrap !gap-2">
            {activity.map(renderActivity)}
          </Box>
        </Box>
      </Box>
    </>);
    function renderBucket(b: AgingBucket) {
        return (<Box className="!h-2 !overflow-hidden !rounded-full !bg-wash" key={b.key}>
                <Box className="!mb-1 !flex !justify-between !text-[12px]">
                  <Text as="span">{b.label}</Text>
                  <Text as="span" className="font-bold">{inr(b.amount)}</Text>
                </Box>
                <Progress className="!h-2 !rounded-[5px]" value={agingMax ? (b.amount / agingMax) * 100 : 0} tone={b.key === "0-30" ? "mid" : "amber"} label={b.label}/>
              </Box>);
    }
    function goTabOnClick() {
        return goTab("issue");
    }
    function goTabOnClick2() {
        return goTab("stock");
    }
    function goTabOnClick3() {
        return goTab("stock");
    }
    function renderW(w: WardConsumption) {
        const max = wardCons[0].net || 1;
        return (<Box key={w.wardId} className={cn("!mb-2.5")}>
                  <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !text-[12.5px] !mb-[3px]")}>
                    <Text as="span">
                      {w.wardName}
                      <Text className="!text-muted" as="span">
                        {" "}
                        · {w.issues} issue{w.issues !== 1 ? "s" : ""}
                      </Text>
                    </Text>
                    <Text as="span" className="font-bold">{inr(w.net)}</Text>
                  </Box>
                  <Progress className="!h-2 !rounded-[5px]" value={(w.net / max) * 100} label={w.wardName}/>
                </Box>);
    }
    function renderTopItem(it: SuppliedItem) {
        return (<TableRow key={it.productId || it.name}>
                    <TableCell>{it.name}</TableCell>
                    <TableCell className={cn("text-right tabular-nums font-semibold text-ink !text-muted", "!text-[12px]")}>
                      ×{it.qty}
                    </TableCell>
                    <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-bold")}>
                      {inr(it.amount)}
                    </TableCell>
                  </TableRow>);
    }
    function flowColumns() {
        return flow.map(function toColumn(month: MonthFlow) {
            return {
                label: month.label,
                segments: [
                    { value: month.supplied, tone: "on" as const },
                    { value: month.received, tone: "off" as const, fill: "#8a6ee0" },
                ],
            };
        });
    }
    function goTabOnClick4() {
        return goTab("account");
    }
    function renderActivity(e: {
        at: number;
        kind: string;
        label: string;
        amount: number;
        sign: number;
        ref: string;
    }, i: number) {
        return (<Box className="!rounded-md !border !border-line !px-3 !py-2" key={i}>
                <Text className={`h-2 w-2 shrink-0 rounded-full ${e.kind === "return" ? "bg-amber" : e.kind === "payment" ? "bg-[#8a6ee0]" : "bg-mid"}`} as="span"/>
                <Text className="flex min-w-0 flex-1 flex-col text-ink" as="span">
                  {e.label}
                  <Text as="span" className="text-[11px] font-semibold">
                    {e.ref} · {timeAgo(e.at, now)}
                  </Text>
                </Text>
                <Text as="span" className={cn("font-bold", e.sign < 0 ? "!text-mid" : "!text-ink")}>
                  {e.sign < 0 ? "−" : ""}
                  {inr(e.amount)}
                </Text>
              </Box>);
    }
}
