import type { Ward, WardSupplyItem } from "@/utils";
import {
  Box,
  Button,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { useAppSelector } from "@/hooks";
import { inr, fmtDateTime } from "@/utils";
import { WardSupplyReason, reasonMeta, WardSupply } from "@/utils/calculations/hospitalAccount";
import { IconSearch, IconHospital, IconReceipt } from "@/components/atoms";
import WardSupplyInvoice from "@/screens/HospitalBilling/components/WardSupplyInvoice";
import { supplyToInvoice } from "@/screens/HospitalBilling/utils/supplyToInvoice";
const REASON_TONE: Record<WardSupplyReason, string> = {
  floor: "!bg-blue-bg !text-blue",
  consumption: "!bg-amber-bg !text-gold-d",
  refill: "!bg-teal-bg !text-teal",
};
export function IssuesTable() {
  const wardSupplies = useAppSelector((state) => state.hospital.wardSupplies);
  const wards = useAppSelector((state) => state.hospital.wards);
  const profile = useAppSelector((state) => state.auth.profile);
  const hospitalAccount = useAppSelector((state) => state.hospital.hospitalAccount);
  const [inv, setInv] = useState<WardSupply | null>(null);
  const [q, setQ] = useState("");
  const [wardId, setWardId] = useState("all");
  const [kind, setKind] = useState<"all" | "issue" | "return" | "refill">("all");
  const ql = q.trim().toLowerCase();
  const rows = [...wardSupplies]
    .filter((s) => {
      if (wardId !== "all" && s.wardId !== wardId) return false;
      if (kind === "issue" && s.kind !== "issue") return false;
      if (kind === "return" && s.kind !== "return") return false;
      if (kind === "refill" && !(s.kind === "issue" && s.reason === "refill")) return false;
      if (
        ql &&
        !`${s.id} ${s.wardName} ${s.patientId ?? ""} ${s.patientName ?? ""} ${s.refDoc ?? ""} ${s.items.map((i) => i.name).join(" ")}`
          .toLowerCase()
          .includes(ql)
      )
        return false;
      return true;
    })
    .sort((a, b) => b.at - a.at);
  const shownTotal =
    rows.filter((s) => s.kind === "issue").reduce((a, s) => a + s.total, 0) -
    rows.filter((s) => s.kind === "return").reduce((a, s) => a + s.total, 0);
  return (
    <>
      <Box className={cn("!mb-4 !flex !flex-wrap !items-center !gap-2.5", "!mb-3")}>
        <Box className="!flex !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none">
          <Text className="!text-green" as="span">
            <IconSearch size={16} />
          </Text>
          <Input
            placeholder="Search ref, ward, patient, medicine…"
            value={q}
            onChange={setQOnChange}
          />
        </Box>
        <Select
          className=""
          value={wardId}
          onChange={setWardIdOnChange}
          options={[{ value: "all", label: "All wards" }, ...wards.map(renderWard)]}
        />
        <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
          {(["all", "issue", "refill", "return"] as const).map(renderK)}
        </Box>
        <Box className="!flex-1" />
        <Text className={cn("!text-muted", "!text-[12.5px]")} as="span">
          {rows.length} row{rows.length !== 1 ? "s" : ""} · net {inr(shownTotal)}
        </Text>
      </Box>
      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2 [&_tr]:!border-0 [&_tbody_tr:hover]:!bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Ref</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Ward</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
                <TableHeaderCell>Patient (refill)</TableHeaderCell>
                <TableHeaderCell>Items</TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">
                  Amount
                </TableHeaderCell>
                <TableHeaderCell>Invoice</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(renderRow)}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconHospital size={28} />
                      </Box>
                      <Text>No ward issues yet — create one with “New ward issue”.</Text>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {inv && (
            <WardSupplyInvoice
              data={supplyToInvoice(inv)}
              profile={profile}
              account={hospitalAccount}
              onClose={setInvOnClose}
            />
          )}
        </Box>
      </Box>
    </>
  );
  function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setQ(e.target.value);
  }
  function setWardIdOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setWardId(e.target.value);
  }
  function renderWard(ward: Ward) {
    return { value: String(ward.id), label: String(ward.name) };
  }
  function renderK(k: "all" | "issue" | "return" | "refill") {
    return (
      <Button
        key={k}
        className={
          kind === k
            ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"
            : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"
        }
        onClick={setKindOnClick}
      >
        {k === "all" ? "All" : k === "issue" ? "Issues" : k === "refill" ? "Refills" : "Returns"}
      </Button>
    );
    function setKindOnClick() {
      return setKind(k);
    }
  }
  function renderRow(s: WardSupply) {
    return (
      <TableRow key={s.id}>
        <TableCell className={cn("!font-mono", "!font-bold")}>
          {s.id}
          {s.refDoc ? <Box className={cn("!text-muted", "!text-[11px]")}>{s.refDoc}</Box> : null}
        </TableCell>
        <TableCell className={cn("!whitespace-nowrap")}>{fmtDateTime(s.at)}</TableCell>
        <TableCell>{s.wardName}</TableCell>
        <TableCell>
          {s.kind === "return" ? (
            <Text
              className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-gray-pill !text-muted"
              as="span"
            >
              Return
            </Text>
          ) : (
            <Text
              className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${REASON_TONE[s.reason]}`}
              as="span"
            >
              {reasonMeta(s.reason).tag}
            </Text>
          )}
        </TableCell>
        <TableCell>
          {s.patientId ? (
            <Text className={cn("!font-mono", "!text-[12px]")} as="span">
              {s.patientId}
              <Box className={cn("!text-muted", "!font-medium")}>{s.patientName}</Box>
            </Text>
          ) : (
            <Text className="!text-muted" as="span">
              —
            </Text>
          )}
        </TableCell>
        <TableCell>
          {s.items.length}
          <Box className={cn("!text-muted", "!text-[11px]")}>
            {s.items.map(matchItem).join(", ").slice(0, 40)}
          </Box>
        </TableCell>
        <TableCell
          className={cn(
            "!text-right !tabular-nums !font-semibold !text-ink",
            "!font-extrabold",
            s.kind === "return" ? "!text-mid" : "!text-ink",
          )}
        >
          {s.kind === "return" ? "−" : ""}
          {inr(s.total)}
        </TableCell>
        <TableCell>
          {s.kind === "issue" ? (
            <Button
              className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs"
              onClick={setInvOnClick}
            >
              <IconReceipt size={13} /> View
            </Button>
          ) : (
            <Text className="!text-muted" as="span">
              —
            </Text>
          )}
        </TableCell>
      </TableRow>
    );
    function matchItem(i: WardSupplyItem) {
      return `${i.name}×${i.qty}`;
    }
    function setInvOnClick() {
      return setInv(s);
    }
  }
  function setInvOnClose() {
    return setInv(null);
  }
}
