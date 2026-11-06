import type { OverviewTabProps } from "./OverviewTab.types";
import type { AgingBucket, SuppliedItem, WardConsumption } from "@/utils";
import {
  Box,
  Button,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import { useMemo } from "react";
import { useAppSelector } from "@/hooks";
import { inr, timeAgo } from "@/utils";
import {
  wardConsumption,
  topSuppliedItems,
  monthlyHospitalFlow,
} from "@/utils/calculations/hospitalAccount";
import {
  IconRupee,
  IconHospital,
  IconReceipt,
  IconArrowRight,
  IconAlert,
  IconChart,
  IconSend,
  IconWallet,
  IconBox,
  IconCalendar,
  IconCheck,
  IconStore,
} from "@/components/atoms";
import { fmtDay } from "@/utils/date";
import { IconClockLite } from "@/screens/HospitalBilling/components/IconClockLite";
export function OverviewTab({
  outstanding,
  supplied,
  returns,
  received,
  aging,
  goTab,
  onRecordPayment,
  onRemind,
}: OverviewTabProps) {
  const wardSupplies = useAppSelector((state) => state.hospital.wardSupplies);
  const hospitalPayments = useAppSelector((state) => state.hospital.hospitalPayments);
  const hospitalAccount = useAppSelector((state) => state.hospital.hospitalAccount);
  const wards = useAppSelector((state) => state.hospital.wards);
  const now = useAppSelector((state) => state.ui.now);
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
  const flow = useMemo(
    () => monthlyHospitalFlow(wardSupplies, hospitalPayments, now, 6),
    [wardSupplies, hospitalPayments, now],
  );
  const flowMax = Math.max(1, ...flow.map((month) => Math.max(month.supplied, month.received)));
  const avgIssue = issues.length ? supplied / issues.length : 0;
  const limit = hospitalAccount.creditLimit || 0;
  const util = limit > 0 ? Math.min(100, Math.round((outstanding / limit) * 100)) : 0;
  const available = Math.max(0, limit - outstanding);
  const near = limit > 0 && util >= 85;
  const activeWards = new Set(issues.map((s) => s.wardId)).size;
  const agingMax = Math.max(1, ...aging.buckets.map((b) => b.amount));
  const activity = useMemo(
    () =>
      [
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
        .slice(0, 6),
    [wardSupplies, hospitalPayments],
  );
  return (
    <>
      {/* credit position + aging */}
      <Box className="!mb-4 !grid !grid-cols-2 !gap-4 max-[1080px]:!grid-cols-1">
        <Box className="!rounded-md !border !border-line !bg-paper !p-[18px] !shadow-sm">
          <Box className="!mb-3 !flex !items-center !gap-[7px] !font-display !text-[13px] !font-extrabold !text-mid">
            <IconWallet size={15} /> Credit position
          </Box>
          <Box className="!mb-2.5 !flex !items-baseline !justify-between">
            <Text as="span" className="!text-[12.5px] !text-muted">
              Hospital owes
            </Text>
            <Text
              as="span"
              className={cn(
                "!font-display !text-[26px] !font-extrabold",
                outstanding > 0 ? "!text-rose" : "!text-mid",
              )}
            >
              {inr(outstanding)}
            </Text>
          </Box>
          {limit > 0 ? (
            <>
              <Box
                className="!h-2.5 !overflow-hidden !rounded-[6px] !bg-wash"
                role="progressbar"
                aria-label="Credit limit"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={util}
              >
                <Box
                  className={cn(
                    "!h-full !rounded-[6px]",
                    near
                      ? "!bg-gradient-to-r !from-amber !to-rose"
                      : "!bg-gradient-to-r !from-green !to-mid",
                  )}
                  style={{ width: `${util}%` }}
                />
              </Box>
              <Box className="!mt-1.5 !flex !justify-between !text-xs !text-muted">
                <Text as="span">
                  {inr(outstanding)} of {inr(limit)} limit
                </Text>
                <Text as="span" className="!font-bold !text-ink-2">
                  {util}% used
                </Text>
              </Box>
              <Box className="!mt-1.5 !flex !justify-between !text-xs !text-muted">
                <Text as="span">Available credit</Text>
                <Text as="span" className="!font-bold !text-mid">
                  {inr(available)}
                </Text>
              </Box>
              {near && (
                <Box className="!mt-2 !flex !items-center !gap-1.5 !rounded-sm !bg-rose-bg !px-[9px] !py-1.5 !text-[11.5px] !font-semibold !text-rose">
                  <IconAlert size={12} /> Credit limit almost reached — collect a payment before
                  issuing more.
                </Box>
              )}
            </>
          ) : (
            <Text className="!text-[12.5px] !text-muted">
              No credit limit set — add one in Account &amp; statement.
            </Text>
          )}
          <Box className="!mt-3.5 !grid !grid-cols-3 !gap-2 !border-t !border-line !pt-3 max-[767px]:!grid-cols-2">
            <Box className="!flex !flex-col">
              <Text
                as="span"
                className="!text-[10.5px] !font-bold !uppercase !tracking-[0.04em] !text-muted"
              >
                Supplied
              </Text>
              <Text as="span" className="!text-sm !text-ink">
                {inr(supplied)}
              </Text>
            </Box>
            <Box className="!flex !flex-col">
              <Text
                as="span"
                className="!text-[10.5px] !font-bold !uppercase !tracking-[0.04em] !text-muted"
              >
                Returns
              </Text>
              <Text as="span" className="!text-sm !text-ink">
                {inr(returns)}
              </Text>
            </Box>
            <Box className="!flex !flex-col">
              <Text
                as="span"
                className="!text-[10.5px] !font-bold !uppercase !tracking-[0.04em] !text-muted"
              >
                Received
              </Text>
              <Text as="span" className="!text-sm !text-ink">
                {inr(received)}
              </Text>
            </Box>
          </Box>
        </Box>

        <Box className="!rounded-md !border !border-line !bg-paper !p-[18px] !shadow-sm">
          <Box className="!mb-3 !flex !items-center !gap-[7px] !font-display !text-[13px] !font-extrabold !text-mid">
            <IconCalendar size={15} /> Ageing of outstanding
            <Button variant="line" size="sm" onClick={onRemind} className="!ml-auto">
              <IconSend size={13} /> Send reminder
            </Button>
          </Box>
          {aging.overdue > 0 ? (
            <Box className="!mb-3 !flex !items-center !gap-[7px] !rounded-[9px] !border !border-[#f3c9c9] !bg-rose-bg !px-[11px] !py-2 !text-[12.5px] !font-semibold !text-[#a0281f]">
              <IconAlert size={14} />{" "}
              <Text as="span" className="!text-[12.5px] !font-extrabold !text-[#a0281f]">
                {inr(aging.overdue)}
              </Text>{" "}
              overdue
              {aging.overdueDays > 0 ? ` · oldest ${aging.overdueDays} days past due` : ""}
              {aging.dueDate ? ` (due ${fmtDay(aging.dueDate)})` : ""}
            </Box>
          ) : (
            <Box className="!mb-3 !flex !items-center !gap-[7px] !rounded-[9px] !bg-wash !px-[11px] !py-2 !text-[12.5px] !font-semibold !text-mid">
              <IconCheck size={14} /> Nothing overdue — all within{" "}
              {hospitalAccount.creditTerms === "On demand" ? "terms" : hospitalAccount.creditTerms}
            </Box>
          )}
          <Box className="!flex !flex-col !gap-[9px]">{aging.buckets.map(renderBucket)}</Box>
        </Box>
      </Box>

      {/* KPIs */}
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box
          className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid"
          role="button"
          tabIndex={0}
          onClick={goTabOnClick}
          onKeyDown={kpiKey(openIssues)}
          title="Ward issues log"
        >
          <Text
            className="pointer-events-none absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            as="span"
          >
            <IconArrowRight size={16} />
          </Text>
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconReceipt size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Ward issues
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums">
            {issues.length}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            billed to hospital
          </Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
            <IconRupee size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Supplied value
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums">
            {inr(supplied)}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            gross, all time
          </Box>
        </Box>
        <Box
          className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid"
          role="button"
          tabIndex={0}
          onClick={onRecordPayment}
          onKeyDown={kpiKey(onRecordPayment)}
          title="Record a payment"
        >
          <Text
            className="pointer-events-none absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            as="span"
          >
            <IconArrowRight size={16} />
          </Text>
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconWallet size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Payments received
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums">
            {inr(received)}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            click to record
          </Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
            <IconArrowRight size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Avg issue value
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums">
            {inr(avgIssue)}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            per ward issue
          </Box>
        </Box>
        <Box
          className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid"
          role="button"
          tabIndex={0}
          onClick={goTabOnClick2}
          onKeyDown={kpiKey(openStock)}
          title="Ward stock on hand"
        >
          <Text
            className="pointer-events-none absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            as="span"
          >
            <IconArrowRight size={16} />
          </Text>
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-teal-bg !text-teal">
            <IconStore size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Active wards
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums">
            {activeWards}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            of {wards.length} total
          </Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-rose-bg !text-rose">
            <IconAlert size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Overdue
          </Box>
          <Box
            className={cn(
              "!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums",
              aging.overdue > 0 && "!text-rose",
            )}
          >
            {inr(aging.overdue)}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            {aging.overdueDays > 0 ? `${aging.overdueDays} days past due` : "on track"}
          </Box>
        </Box>
      </Box>

      {/* leaderboards */}
      <Box className="!mt-4 !grid !grid-cols-2 !gap-4 max-[1080px]:!grid-cols-1">
        <Box className="!rounded-md !border !border-line !bg-paper !p-[18px] !shadow-sm">
          <Box className="!mb-3 !flex !items-center !gap-[7px] !font-display !text-[13px] !font-extrabold !text-mid">
            <IconHospital size={15} /> Consumption by ward
            <Button variant="line" size="sm" onClick={goTabOnClick3} className="!ml-auto">
              Ward stock <IconArrowRight size={13} />
            </Button>
          </Box>
          {wardCons.length === 0 ? (
            <Text className="!text-[12.5px] !text-muted">No ward issues yet.</Text>
          ) : (
            wardCons.slice(0, 5).map(renderWardConsumption)
          )}
        </Box>
        <Box className="!rounded-md !border !border-line !bg-paper !p-[18px] !shadow-sm">
          <Box className="!mb-3 !flex !items-center !gap-[7px] !font-display !text-[13px] !font-extrabold !text-mid">
            <IconBox size={15} /> Top medicines supplied
          </Box>
          {topItems.length === 0 ? (
            <Text className="!text-[12.5px] !text-muted">No data yet.</Text>
          ) : (
            <Table className="!w-full !border-separate !border-spacing-0 !text-[12.5px] [&_td]:!border-b [&_td]:!border-line [&_td]:!px-1 [&_td]:!py-1.5 [&_td]:!align-middle [&_td]:!text-[12.5px] [&_td]:!text-ink-2 [&_tr]:!border-0 [&_tbody_tr:last-child_td]:!border-b-0 [&_tbody_tr:hover]:!bg-wash-2">
              <TableBody>{topItems.map(renderTopItem)}</TableBody>
            </Table>
          )}
        </Box>
      </Box>

      {/* monthly flow + recent activity */}
      <Box className="!mt-4 !grid !grid-cols-2 !gap-4 max-[1080px]:!grid-cols-1">
        <Box className="!rounded-md !border !border-line !bg-paper !p-[18px] !shadow-sm">
          <Box className="!mb-3 !flex !items-center !gap-[7px] !font-display !text-[13px] !font-extrabold !text-mid">
            <IconChart size={15} /> Supplied vs received · 6 months
          </Box>
          <Box className="!flex !h-[130px] !items-end !justify-between !gap-2.5 !pt-1.5">
            {flow.map(renderFlow)}
          </Box>
          <Box className="!mt-1 !mb-3 !flex !gap-4 !text-xs !text-ink-2">
            <Text as="span">
              <Text
                as="span"
                className="!mr-[5px] !inline-block !h-2.5 !w-2.5 !rounded-[3px] !bg-mid !align-[-1px]"
              />{" "}
              Supplied
            </Text>
            <Text as="span">
              <Text
                as="span"
                className="!mr-[5px] !inline-block !h-2.5 !w-2.5 !rounded-[3px] !bg-[#8a6ee0] !align-[-1px]"
              />{" "}
              Received
            </Text>
          </Box>
        </Box>
        <Box className="!rounded-md !border !border-line !bg-paper !p-[18px] !shadow-sm">
          <Box className="!mb-3 !flex !items-center !gap-[7px] !font-display !text-[13px] !font-extrabold !text-mid">
            <IconClockLite /> Recent activity
            <Button variant="line" size="sm" onClick={goTabOnClick4} className="!ml-auto">
              Statement <IconArrowRight size={13} />
            </Button>
          </Box>
          <Box className="!flex !flex-col">{activity.map(renderActivity)}</Box>
        </Box>
      </Box>
    </>
  );
  function renderBucket(b: AgingBucket) {
    return (
      <Box key={b.key}>
        <Box className="!mb-[3px] !flex !justify-between !text-xs">
          <Text as="span" className="!text-xs !text-ink">
            {b.label}
          </Text>
          <Text as="span" className="!text-xs !font-bold !text-ink">
            {inr(b.amount)}
          </Text>
        </Box>
        <Progress
          className="!h-[7px] !rounded-[5px]"
          value={agingMax ? (b.amount / agingMax) * 100 : 0}
          tone={b.key === "0-30" ? "mid" : "amber"}
          label={b.label}
        />
      </Box>
    );
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
  function renderWardConsumption(wardConsumption: WardConsumption) {
    const max = wardCons[0].net || 1;
    return (
      <Box key={wardConsumption.wardId} className={cn("!mb-2.5")}>
        <Box
          className={cn(
            "!flex !items-center !gap-2.5",
            "!justify-between !text-[12.5px] !mb-[3px]",
          )}
        >
          <Text as="span">
            {wardConsumption.wardName}
            <Text className="!text-muted" as="span">
              {" "}
              · {wardConsumption.issues} issue{wardConsumption.issues !== 1 ? "s" : ""}
            </Text>
          </Text>
          <Text as="span" className="font-bold">
            {inr(wardConsumption.net)}
          </Text>
        </Box>
        <Progress
          className="!h-[7px] !rounded-[5px]"
          value={(wardConsumption.net / max) * 100}
          label={wardConsumption.wardName}
        />
      </Box>
    );
  }
  function renderTopItem(it: SuppliedItem) {
    return (
      <TableRow key={it.productId || it.name}>
        <TableCell>{it.name}</TableCell>
        <TableCell
          className={cn(
            "text-right tabular-nums font-semibold text-ink !text-muted",
            "!text-[12px]",
          )}
        >
          ×{it.qty}
        </TableCell>
        <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-bold")}>
          {inr(it.amount)}
        </TableCell>
      </TableRow>
    );
  }
  function renderFlow(month: { label: string; supplied: number; received: number }, i: number) {
    return (
      <Box className="!flex !h-full !flex-1 !flex-col !items-center !gap-[5px]" key={i}>
        <Box className="!flex !w-full !flex-1 !items-end !justify-center !gap-[3px]">
          <Text
            as="span"
            className="!w-3 !min-h-[2px] !rounded-t-[3px] !bg-mid"
            style={{ height: `${(month.supplied / flowMax) * 100}%` }}
            title={`Supplied ${inr(month.supplied)}`}
          />
          <Text
            as="span"
            className="!w-3 !min-h-[2px] !rounded-t-[3px] !bg-[#8a6ee0]"
            style={{ height: `${(month.received / flowMax) * 100}%` }}
            title={`Received ${inr(month.received)}`}
          />
        </Box>
        <Text as="span" className="!text-[11px] !text-muted">
          {month.label}
        </Text>
      </Box>
    );
  }
  function goTabOnClick4() {
    return goTab("account");
  }
  function renderActivity(
    e: {
      at: number;
      kind: string;
      label: string;
      amount: number;
      sign: number;
      ref: string;
    },
    i: number,
  ) {
    return (
      <Box
        className="!flex !items-center !gap-[9px] !border-b !border-line !py-[7px] !text-[12.5px] last:!border-b-0"
        key={i}
      >
        <Text
          className={`!h-2 !w-2 !shrink-0 !rounded-full ${e.kind === "return" ? "!bg-amber" : e.kind === "payment" ? "!bg-[#8a6ee0]" : "!bg-mid"}`}
          as="span"
        />
        <Text className="!flex !min-w-0 !flex-1 !flex-col !text-[12.5px] !text-ink" as="span">
          {e.label}
          <Text as="span" className="!text-[10.5px] !text-muted">
            {e.ref} · {timeAgo(e.at, now)}
          </Text>
        </Text>
        <Text
          as="span"
          className={cn("!font-display !font-bold", e.sign < 0 ? "!text-mid" : "!text-ink")}
        >
          {e.sign < 0 ? "−" : ""}
          {inr(e.amount)}
        </Text>
      </Box>
    );
  }
}
