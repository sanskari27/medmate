import type { SaleItem, SaleSource } from "@/utils";
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
import { useState, useMemo } from "react";
import { usePharma } from "@/hooks";
import { inr, fmtDateTime, Sale, PayMode, PAY_LABEL, SALE_SOURCES, saleSourceOf } from "@/utils";
import { billTotal } from "./PatientBills.utils";
import { buildPatientLedger, PatientGroup } from "@/utils/calculations/hospital";
import { IconSearch, IconX, IconRupee, IconCheck } from "@/components/atoms";
import { SaleSourceIcon } from "@/components/molecules";
const SETTLE_MODES: PayMode[] = ["cash", "upi", "card", "insurance"];
export default function PatientBillsScreen() {
  const { sales, settleBills, profile, now } = usePharma();
  const [tab, setTab] = useState<"active" | "all">("active");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const groups = useMemo(() => buildPatientLedger(sales), [sales]);
  const shown = groups
    .filter((g) => tab === "all" || g.outstanding > 0)
    .filter(
      (g) =>
        !q.trim() || `${g.patientId} ${g.name} ${g.ward}`.toLowerCase().includes(q.toLowerCase()),
    );
  const activeCount = groups.filter((g) => g.outstanding > 0).length;
  const totalOutstanding = groups.reduce((a, g) => a + g.outstanding, 0);
  const unsettledBills = groups.reduce((a, g) => a + g.unsettled, 0);
  const current = groups.find((g) => g.key === sel) ?? null;
  return (
    <Box className="!mx-auto !max-w-[1680px]">
      <Box className={cn("!mb-3.5 !flex !flex-wrap !gap-2.5", "!mb-4")}>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Active patients
          <Text
            as="span"
            className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
          >
            {activeCount}
          </Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Outstanding
          <Text
            as="span"
            className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
          >
            {inr(totalOutstanding)}
          </Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Unsettled bills
          <Text
            as="span"
            className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
          >
            {unsettledBills}
          </Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          In-patients (total)
          <Text
            as="span"
            className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
          >
            {groups.length}
          </Text>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Box className="!flex !items-center !gap-1.5">
          <Button
            className={cn(
              "!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 max-[767px]:!min-h-10",
              tab === "active" &&
                "!border-dark !bg-dark !text-white hover:!border-dark hover:!bg-dark",
            )}
            onClick={setTabOnClick}
          >
            Active · unsettled
          </Button>
          <Button
            className={cn(
              "!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 max-[767px]:!min-h-10",
              tab === "all" &&
                "!border-dark !bg-dark !text-white hover:!border-dark hover:!bg-dark",
            )}
            onClick={setTabOnClick2}
          >
            All in-patients
          </Button>
        </Box>
        <Box className="!flex-1" />
        <Box className="!flex !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none">
          <Text className="!text-green" as="span">
            <IconSearch size={17} />
          </Text>
          <Input placeholder="Patient ID, name, ward…" value={q} onChange={setQOnChange} />
        </Box>
      </Box>

      <Box className="!mt-4 !grid !grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] !gap-4">
        {shown.map(renderShown)}
        {shown.length === 0 && (
          <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
            {tab === "active" ? "No patients with unsettled bills" : "No in-patient bills yet."}
          </Box>
        )}
      </Box>

      {current && (
        <SettleModal
          g={current}
          onClose={setSelOnClose}
          settleBills={settleBills}
          profileName={profile.name}
          now={now}
        />
      )}
    </Box>
  );
  function setTabOnClick() {
    return setTab("active");
  }
  function setTabOnClick2() {
    return setTab("all");
  }
  function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setQ(e.target.value);
  }
  function renderShown(g: PatientGroup) {
    const so = SALE_SOURCES.find(matchSALESOURCES)!;
    return (
      <Button
        key={g.key}
        onClick={setSelOnClick}
        className="!flex !h-auto !w-full !cursor-pointer !flex-col !items-stretch !justify-start !rounded-md !border !border-line !bg-paper !p-[18px] !text-left !font-normal !text-ink !shadow-sm !transition hover:!border-light"
      >
        <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !items-start")}>
          <Box>
            <Heading className={cn("!text-[16px]")} level={3}>
              {g.name}
            </Heading>
            <Box className={cn("!text-muted", "!text-[12.5px] !mt-0.5")}>
              {g.patientId || "No Patient ID"} · <SaleSourceIcon k={so.key} size={13} /> {g.ward}
            </Box>
          </Box>
          <Text
            className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${g.outstanding > 0 ? "!bg-rose-bg !text-rose" : "!bg-wash !text-mid"}`}
            as="span"
          >
            {g.outstanding > 0 ? "Active" : "Settled"}
          </Text>
        </Box>
        <Box
          className={cn("!flex !items-center !gap-2.5", "!justify-between !mt-3.5 !text-[13px]")}
        >
          <Text className="!text-muted" as="span">
            {g.bills.length} bill{g.bills.length !== 1 ? "s" : ""}
            {g.unsettled ? ` · ${g.unsettled} unsettled` : ""}
          </Text>
          <Text
            className={cn(
              "!font-display !font-extrabold !text-[16px]",
              g.outstanding > 0 ? "!text-rose" : "!text-mid",
            )}
            as="span"
          >
            {inr(g.outstanding > 0 ? g.outstanding : g.total)}
          </Text>
        </Box>
      </Button>
    );
    function matchSALESOURCES(x: { key: SaleSource; label: string; short: string }) {
      return x.key === g.source;
    }
    function setSelOnClick() {
      return setSel(g.key);
    }
  }
  function setSelOnClose() {
    return setSel(null);
  }
}
function SettleModal({
  g,
  onClose,
  settleBills,
}: {
  g: PatientGroup;
  onClose: () => void;
  settleBills: (ids: string[], m: PayMode) => void;
  profileName: string;
  now: number;
}) {
  const [mode, setMode] = useState<PayMode>("cash");
  const unpaid = g.bills.filter((b) => b.paid === false);
  const so = SALE_SOURCES.find((x) => x.key === g.source)!;
  const settle = () => {
    settleBills(
      unpaid.map((b) => b.id),
      mode,
    );
    onClose();
  };
  return (
    <Box
      className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px] animate-[pd-fade_0.16s_ease] motion-reduce:animate-none max-[767px]:!items-end max-[767px]:!p-0"
      onClick={onClose}
    >
      <Box
        className="!flex !max-h-[90vh] !w-full !max-w-[720px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop animate-[pd-pop_0.2s_cubic-bezier(0.2,0.9,0.3,1.2)] motion-reduce:animate-none max-[767px]:!max-h-[92dvh] max-[767px]:!max-w-none max-[767px]:!rounded-t-2xl max-[767px]:!rounded-b-none"
        onClick={stopPropagationOnClick}
      >
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Box>
            <Heading level={3}>{g.name}</Heading>
            <Text as="span" className="text-[11px] font-semibold !text-muted">
              {g.patientId || "No Patient ID"} · <SaleSourceIcon k={so.key} size={13} /> {g.ward} ·
              last bill {fmtDateTime(g.lastAt)}
            </Text>
          </Box>
          <Button
            className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid !p-0 !shadow-none"
            onClick={onClose}
          >
            <IconX size={18} />
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box className={cn("!mb-3.5 !flex !flex-wrap !gap-2.5", "!mb-3.5")}>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Bills
              <Text
                as="span"
                className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
              >
                {g.bills.length}
              </Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Total
              <Text
                as="span"
                className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
              >
                {inr(g.total)}
              </Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Settled
              <Text
                as="span"
                className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
              >
                {inr(g.paid)}
              </Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Outstanding
              <Text
                as="span"
                className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
              >
                {inr(g.outstanding)}
              </Text>
            </Box>
          </Box>

          <Box className="!overflow-x-auto">
            <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2 [&_tr]:!border-0 [&_tbody_tr:hover]:!bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Invoice</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Source</TableHeaderCell>
                  <TableHeaderCell>Items</TableHeaderCell>
                  <TableHeaderCell>Payment</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">
                    Amount
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>{g.bills.map(renderBill)}</TableBody>
            </Table>
          </Box>

          {unpaid.length > 0 ? (
            <Box
              className={cn(
                "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]",
                "!mt-4 !bg-wash-2",
              )}
            >
              <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mb-2.5")}>
                <Text as="span" className="font-bold">
                  Settle {unpaid.length} unsettled bill{unpaid.length !== 1 ? "s" : ""}
                </Text>
                <Text className={cn("!font-display !font-extrabold !text-rose")} as="span">
                  {inr(g.outstanding)}
                </Text>
              </Box>
              <Box className={cn("!flex !items-center !gap-1.5", "!mb-3 !flex-wrap")}>
                {SETTLE_MODES.map(renderSETTLEMODES)}
              </Box>
              <Button
                className="!bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-sm !px-[22px] !py-[13px] !text-[14.5px] !w-full"
                onClick={settle}
              >
                <IconRupee size={16} /> Settle {inr(g.outstanding)} · {PAY_LABEL[mode]}
              </Button>
            </Box>
          ) : (
            <Box
              className={cn(
                "!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid",
                "!w-full !justify-center !p-2.5 !mt-4",
              )}
            >
              <IconCheck size={14} /> All bills settled for this patient
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function renderBill(b: Sale) {
    return (
      <TableRow key={b.id}>
        <TableCell className={cn("!font-mono", "!font-bold")}>{b.id}</TableCell>
        <TableCell className={cn("!whitespace-nowrap")}>{fmtDateTime(b.createdAt)}</TableCell>
        <TableCell>{SALE_SOURCES.find(matchSALESOURCES2)!.short}</TableCell>
        <TableCell>
          {b.items.length} item{b.items.length !== 1 ? "s" : ""}
          <Box className={cn("!text-muted", "!text-[11px]")}>
            {b.items.map(matchItem).join(", ").slice(0, 40)}
            {b.items.map(matchItem2).join(", ").length > 40 ? "…" : ""}
          </Box>
        </TableCell>
        <TableCell>
          {PAY_LABEL[b.payMode]}
          {b.insurer ? <Box className={cn("!text-muted", "!text-[11px]")}>{b.insurer}</Box> : null}
        </TableCell>
        <TableCell>
          <Text
            className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${b.paid === false ? "!bg-rose-bg !text-rose" : "!bg-wash !text-mid"}`}
            as="span"
          >
            {b.paid === false ? "Unpaid" : "Paid"}
          </Text>
        </TableCell>
        <TableCell
          className={cn("text-right tabular-nums font-semibold text-ink", "!font-extrabold")}
        >
          {inr(billTotal(b))}
        </TableCell>
      </TableRow>
    );
    function matchSALESOURCES2(x: { key: SaleSource; label: string; short: string }) {
      return x.key === saleSourceOf(b);
    }
    function matchItem(i: SaleItem) {
      return i.name;
    }
    function matchItem2(i: SaleItem) {
      return i.name;
    }
  }
  function renderSETTLEMODES(m: PayMode) {
    return (
      <Button
        key={m}
        className={cn(
          "!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 max-[767px]:!min-h-10",
          mode === m && "!border-dark !bg-dark !text-white hover:!border-dark hover:!bg-dark",
        )}
        onClick={setModeOnClick}
      >
        {PAY_LABEL[m]}
      </Button>
    );
    function setModeOnClick() {
      return setMode(m);
    }
  }
}
