import type { CreditBucket, CreditPayment } from "@/utils";
import {
  Box,
  Button,
  Heading,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { KhataModal } from "@/screens/Khata/components/KhataModal";
import { useState, useMemo } from "react";
import { useAppSelector, useConfirmedDispatch, usePharmacyNav } from "@/hooks";
import { recordCreditPayment } from "@/store/thunks/customers.thunk";
import {
  inr,
  fmtDateTime,
  PAY_LABEL,
  CreditCustomer,
  creditCustomers,
  totalCreditOutstanding,
  waLink,
  collectMsg,
  creditAging,
  creditAgingBuckets,
} from "@/utils";
import {
  IconSearch,
  IconCheck,
  IconWhatsApp,
  IconRupee,
  IconReceipt,
  IconUsers,
  IconAlert,
  IconArrowRight,
} from "@/components/atoms";
import { SegmentBar } from "@/components/molecules/BarChart";
import { Swatch } from "@/components/organisms/DonutChart";
import { accountsWithBalance } from "./Khata.utils";
const BUCKET_TONE: Record<string, string> = {
  cur: "var(--color-green)",
  d60: "var(--color-gold)",
  d60p: "var(--color-rose)",
};
export default function KhataScreen() {
  const confirm = useConfirmedDispatch();
  const { go } = usePharmacyNav();
  const sales = useAppSelector((state) => state.sales.sales);
  const creditPayments = useAppSelector((state) => state.customers.creditPayments);
  const profile = useAppSelector((state) => state.auth.profile);
  const now = useAppSelector((state) => state.ui.now);
  async function saveCreditPayment(payment: Parameters<typeof recordCreditPayment>[0]) {
    const result = await confirm(recordCreditPayment(payment));
    return "fault" in result ? result.fault : null;
  }
  const [tab, setTab] = useState<"dues" | "history">("dues");
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState<CreditCustomer | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sort, setSort] = useState<"out" | "age">("out");
  const rows = useMemo(() => creditCustomers(sales, creditPayments), [sales, creditPayments]);
  const due = useMemo(() => accountsWithBalance(rows), [rows]);
  const agingByKey = useMemo(
    () => new Map(due.map((r) => [r.key, creditAging(r.key, sales, creditPayments, now)])),
    [due, sales, creditPayments, now],
  );
  const outstanding = totalCreditOutstanding(sales, creditPayments);
  const given = rows.reduce((sum, row) => sum + row.given, 0);
  const repaid = rows.reduce((sum, row) => sum + row.repaid, 0);
  const overdue = due.filter((row) => agingByKey.get(row.key)?.overdue);
  const overdueAmount = overdue.reduce((sum, row) => sum + row.outstanding, 0);
  const buckets = useMemo(
    () => creditAgingBuckets(due, sales, creditPayments, now),
    [due, sales, creditPayments, now],
  );
  const monthStart = useMemo(() => {
    const d = new Date(now);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [now]);
  const collectedMonth = creditPayments
    .filter((p) => p.at >= monthStart)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const avgOut = due.length ? outstanding / due.length : 0;
  const collectionRate = given > 0 ? Math.round((repaid / given) * 100) : 0;
  const history = useMemo(
    () => [...creditPayments].sort((left, right) => right.at - left.at),
    [creditPayments],
  );
  const filteredDue = useMemo(() => {
    let l = due.filter(
      (r) =>
        (!overdueOnly || agingByKey.get(r.key)?.overdue) &&
        (!searchQuery || `${r.name} ${r.phone}`.toLowerCase().includes(searchQuery.toLowerCase())),
    );
    l = [...l].sort((left, right) =>
      sort === "age"
        ? (agingByKey.get(right.key)?.ageDays ?? 0) - (agingByKey.get(left.key)?.ageDays ?? 0)
        : right.outstanding - left.outstanding,
    );
    return l;
  }, [due, overdueOnly, searchQuery, sort, agingByKey]);
  const goDues = (od: boolean) => {
    setTab("dues");
    setOverdueOnly(od);
  };
  const dueOutstanding = filteredDue.reduce(addOutstanding, 0);
  const historyCollected = history.reduce(addPayment, 0);
  function addOutstanding(sum: number, row: (typeof filteredDue)[number]) {
    return sum + row.outstanding;
  }
  function addPayment(sum: number, payment: (typeof history)[number]) {
    return sum + payment.amount;
  }
  return (
    <Box className="!mx-auto !max-w-[1680px]">
      {/* clickable KPI cards */}
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box
          className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid"
          role="button"
          tabIndex={0}
          onClick={goDuesOnClick}
          title="See who owes you"
        >
          <Text
            className="pointer-events-none absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            as="span"
          >
            <IconArrowRight size={16} />
          </Text>
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-rose-bg !text-rose">
            <IconReceipt size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Total outstanding
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">
            {inr(outstanding)}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            {due.length} account{due.length !== 1 ? "s" : ""} · avg {inr(avgOut)}
          </Box>
        </Box>
        <Box
          className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid"
          role="button"
          tabIndex={0}
          onClick={goDuesOnClick2}
          title="Overdue > 30 days"
        >
          <Text
            className="pointer-events-none absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            as="span"
          >
            <IconArrowRight size={16} />
          </Text>
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
            <IconAlert size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Overdue (30d+)
          </Box>
          <Box
            className={cn(
              "!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums",
              overdueAmount > 0 && "!text-rose",
            )}
          >
            {inr(overdueAmount)}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            {overdue.length} account{overdue.length !== 1 ? "s" : ""} to chase
          </Box>
        </Box>
        <Box
          className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid"
          role="button"
          tabIndex={0}
          onClick={setTabOnClick}
          title="View repayments"
        >
          <Text
            className="pointer-events-none absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            as="span"
          >
            <IconArrowRight size={16} />
          </Text>
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconRupee size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Collected this month
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">
            {inr(collectedMonth)}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            {repaid > 0 ? `${collectionRate}% collection rate` : "no repayments yet"}
          </Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
            <IconUsers size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Credit given (all time)
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">
            {inr(given)}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            {rows.length} khata account{rows.length !== 1 ? "s" : ""}
          </Box>
        </Box>
      </Box>

      {/* aging analysis */}
      <Box
        className={cn(
          "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm",
          "!mt-4",
        )}
      >
        <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
          <Heading level={3}>Aging of receivables</Heading>
          <Text className="text-[12.5px] text-muted" as="span">
            by oldest unpaid bill · click a band to filter
          </Text>
        </Box>
        <Box className="!flex-1 !p-[18px]">
          {outstanding > 0 ? (
            <SegmentBar
              className="h-4 overflow-hidden rounded-full"
              segments={bucketSegments()}
              onSelect={selectBucket}
            />
          ) : (
            <Box className="h-4 rounded-full bg-wash" />
          )}
          <Box className="!mt-2 !flex !flex-wrap !gap-3 !text-[12px] !text-muted">
            {buckets.map(renderBucket2)}
          </Box>
        </Box>
      </Box>

      <Box className={cn("!mb-4 !flex !flex-wrap !items-center !gap-2.5", "!mt-4")}>
        <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
          <Button
            className={
              tab === "dues"
                ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"
                : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"
            }
            onClick={setTabOnClick2}
          >
            Outstanding{due.length ? ` · ${due.length}` : ""}
          </Button>
          <Button
            className={
              tab === "history"
                ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"
                : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"
            }
            onClick={setTabOnClick3}
          >
            Payment history
          </Button>
        </Box>
        <Box className="!flex-1" />
        {tab === "dues" && (
          <>
            <Button
              className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${overdueOnly ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`}
              onClick={setOverdueOnlyOnClick}
            >
              <IconAlert size={13} /> Overdue only{overdue.length ? ` · ${overdue.length}` : ""}
            </Button>
            <Box
              className={cn(
                "!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5",
                "!p-0.5",
              )}
            >
              <Button
                onClick={setSortOnClick}
                className={cn(
                  sort === "out"
                    ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"
                    : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold",
                  "!py-[5px] !px-2.5",
                )}
              >
                Amount
              </Button>
              <Button
                onClick={setSortOnClick2}
                className={cn(
                  sort === "age"
                    ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"
                    : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold",
                  "!py-[5px] !px-2.5",
                )}
              >
                Oldest
              </Button>
            </Box>
            <Box className="!flex !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none">
              <Text className="!text-green" as="span">
                <IconSearch size={17} />
              </Text>
              <Input
                placeholder="Search customer or phone…"
                value={searchQuery}
                onChange={setSearchQueryOnChange}
              />
            </Box>
          </>
        )}
        <Button
          className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
          onClick={goOnClick}
        >
          <IconReceipt size={15} /> New credit sale
        </Button>
      </Box>

      {tab === "dues" ? (
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!overflow-x-auto">
            <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!z-[1] [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:text-ink-2 [&_tr]:!border-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:!bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0 [&_tfoot_td]:!border-b-0 [&_tfoot_td]:!border-t-2 [&_tfoot_td]:!border-t-line-2 [&_tfoot_td]:!bg-wash-2 [&_tfoot_td]:!font-extrabold [&_tfoot_td]:!text-ink">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Phone</TableHeaderCell>
                  <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">
                    Bills
                  </TableHeaderCell>
                  <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">
                    Given
                  </TableHeaderCell>
                  <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">
                    Repaid
                  </TableHeaderCell>
                  <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">
                    Outstanding
                  </TableHeaderCell>
                  <TableHeaderCell>Age</TableHeaderCell>
                  <TableHeaderCell>Collect</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDue.map(renderFilteredDue)}
                {filteredDue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
                        <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                          <IconCheck size={28} />
                        </Box>
                        <Text>
                          {overdueOnly
                            ? "No overdue accounts — nicely collected!"
                            : "No outstanding credit — all khata settled."}
                        </Text>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {filteredDue.length > 0 && (
                <tfoot>
                  <TableRow>
                    <TableCell colSpan={5}>
                      Total · {filteredDue.length} account{filteredDue.length !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell className="!text-right !tabular-nums !font-extrabold !text-ink">
                      {inr(dueOutstanding)}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </tfoot>
              )}
            </Table>
          </Box>
        </Box>
      ) : (
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!overflow-x-auto">
            <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!z-[1] [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:text-ink-2 [&_tr]:!border-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:!bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0 [&_tfoot_td]:!border-b-0 [&_tfoot_td]:!border-t-2 [&_tfoot_td]:!border-t-line-2 [&_tfoot_td]:!bg-wash-2 [&_tfoot_td]:!font-extrabold [&_tfoot_td]:!text-ink">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Receipt</TableHeaderCell>
                  <TableHeaderCell>Date & time</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Mode</TableHeaderCell>
                  <TableHeaderCell>Note</TableHeaderCell>
                  <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">
                    Amount
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map(renderHistory)}
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
                        <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                          <IconReceipt size={28} />
                        </Box>
                        <Text>No repayments recorded yet.</Text>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {history.length > 0 && (
                <tfoot>
                  <TableRow>
                    <TableCell colSpan={5}>
                      Total collected · {history.length} repayment{history.length !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell className="!text-right !tabular-nums !font-extrabold !text-ink">
                      {inr(historyCollected)}
                    </TableCell>
                  </TableRow>
                </tfoot>
              )}
            </Table>
          </Box>
        </Box>
      )}

      {open && (
        <KhataModal
          c={open}
          onClose={setOpenOnClose}
          sales={sales}
          creditPayments={creditPayments}
          recordCreditPayment={saveCreditPayment}
          profile={profile}
          now={now}
          go={go}
        />
      )}
    </Box>
  );
  function goDuesOnClick() {
    return goDues(false);
  }
  function goDuesOnClick2() {
    return goDues(true);
  }
  function setTabOnClick() {
    return setTab("history");
  }
  function bucketSegments() {
    return buckets
      .filter(function hasAmount(bucket: CreditBucket) {
        return bucket.amount > 0;
      })
      .map(function toSegment(bucket: CreditBucket) {
        return {
          key: bucket.key,
          value: bucket.amount,
          color: BUCKET_TONE[bucket.key] ?? "var(--color-green)",
          label: `${bucket.label}: ${inr(bucket.amount)}`,
        };
      });
  }
  function selectBucket(key: string) {
    goDues(key !== "cur");
  }
  function renderBucket2(b: CreditBucket) {
    return (
      <Button
        key={b.key}
        className="flex items-center gap-[7px] rounded-[10px] border border-line bg-wash-2 px-3 py-[7px] text-[12.5px] hover:border-line-2"
        onClick={goDuesOnClick4}
      >
        <Swatch color={BUCKET_TONE[b.key] ?? "var(--color-green)"} />
        <Text className="font-semibold text-muted" as="span">
          {b.label}
        </Text>
        <Text as="span" className="font-bold">
          {inr(b.amount)}
        </Text>
        <Text className={cn("!text-muted", "!text-[11px]")} as="span">
          {b.count} a/c
        </Text>
      </Button>
    );
    function goDuesOnClick4() {
      return goDues(b.key !== "cur");
    }
  }
  function setTabOnClick2() {
    return setTab("dues");
  }
  function setTabOnClick3() {
    return setTab("history");
  }
  function setOverdueOnlyOnClick() {
    return setOverdueOnly((v) => !v);
  }
  function setSortOnClick() {
    return setSort("out");
  }
  function setSortOnClick2() {
    return setSort("age");
  }
  function setSearchQueryOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setSearchQuery(e.target.value);
  }
  function goOnClick() {
    return go("pos");
  }
  function renderFilteredDue(r: CreditCustomer) {
    const ag = agingByKey.get(r.key);
    return (
      <TableRow key={r.key} onClick={setOpenOnClick} className={cn("!cursor-pointer")}>
        <TableCell>
          <Box className="flex items-center gap-2.5">
            <Text
              className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] font-display font-bold leading-none text-mid"
              as="span"
            >
              <IconUsers size={15} />
            </Text>
            <Text className="!font-bold !text-ink" as="span">
              {r.name}
            </Text>
          </Box>
        </TableCell>
        <TableCell className="!font-mono">{r.phone || "—"}</TableCell>
        <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">
          {r.bills}
        </TableCell>
        <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">
          {inr(r.given)}
        </TableCell>
        <TableCell className="!text-right !tabular-nums !font-semibold !text-ink !text-muted">
          {inr(r.repaid)}
        </TableCell>
        <TableCell
          className={cn(
            "!text-right !tabular-nums !font-semibold !text-ink",
            "!font-extrabold !text-rose",
          )}
        >
          {inr(r.outstanding)}
        </TableCell>
        <TableCell>
          <Text
            className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${ag?.overdue ? "!bg-rose-bg !text-rose" : ag && ag.ageDays > 15 ? "!bg-amber-bg !text-gold-d" : "!bg-gray-pill !text-muted"}`}
            as="span"
          >
            {ag?.ageDays ?? 0}d{ag?.overdue ? " · overdue" : ""}
          </Text>
        </TableCell>
        <TableCell onClick={stopPropagationOnClick}>
          <Button
            className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs"
            disabled={!r.phone}
            title="WhatsApp reminder"
            onClick={openOnClick}
          >
            <IconWhatsApp size={14} /> Remind
          </Button>
        </TableCell>
      </TableRow>
    );
    function setOpenOnClick() {
      return setOpen(r);
    }
    function stopPropagationOnClick(e: MouseEvent<HTMLTableDataCellElement>) {
      return e.stopPropagation();
    }
    function openOnClick() {
      return window.open(
        waLink(r.phone, collectMsg(r.name, profile.name, r.outstanding, profile.phone)),
        "_blank",
      );
    }
  }
  function renderHistory(p: CreditPayment) {
    const c = rows.find(matchRow);
    return (
      <TableRow
        key={p.id}
        onClick={setOpenOnClick2}
        className={cn(c ? "!cursor-pointer" : "!cursor-default")}
      >
        <TableCell className={cn("!font-mono", "!font-bold")}>{p.id}</TableCell>
        <TableCell className={cn("!whitespace-nowrap")}>{fmtDateTime(p.at)}</TableCell>
        <TableCell>{p.custName}</TableCell>
        <TableCell>{PAY_LABEL[p.mode]}</TableCell>
        <TableCell className="!text-muted">{p.note || "—"}</TableCell>
        <TableCell
          className={cn(
            "!text-right !tabular-nums !font-semibold !text-ink",
            "!font-extrabold !text-green",
          )}
        >
          +{inr(p.amount)}
        </TableCell>
      </TableRow>
    );
    function matchRow(x: CreditCustomer) {
      return x.key === p.custKey;
    }
    function setOpenOnClick2() {
      return c && setOpen(c);
    }
  }
  function setOpenOnClose() {
    return setOpen(null);
  }
}
