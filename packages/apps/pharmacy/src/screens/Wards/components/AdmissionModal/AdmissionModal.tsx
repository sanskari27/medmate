import type { AdmissionModalProps } from "./AdmissionModal.types";
import type { Sale, SaleItem } from "@/utils";
import { Box, Button, Heading, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { MouseEvent } from "react";
import { useState, useMemo } from "react";
import { usePharma } from "@/hooks";
import { inr, fmtDateTime, PayMode, PAY_LABEL } from "@/utils";
import { Admission } from "@/utils/calculations/hospital";
import { IconX, IconRupee, IconPos, IconCheck } from "@/components/atoms";
import { billTotal } from "@/screens/Wards/utils/billTotal";
import { daysIn } from "@/screens/Wards/utils/daysIn";
const SETTLE_MODES: PayMode[] = ["cash", "upi", "card", "insurance"];
export function AdmissionModal({ adm, onClose }: AdmissionModalProps) {
    const { sales, now, settleBills, dischargePatient, startWardBilling } = usePharma();
    const bills = useMemo(() => sales
        .filter((s) => s.patientId === adm.patientId && s.status !== "cancelled")
        .sort((a, b) => b.createdAt - a.createdAt), [sales, adm.patientId]);
    const total = bills.reduce((a, s) => a + billTotal(s), 0);
    const unpaid = bills.filter((s) => s.paid === false);
    const outstanding = unpaid.reduce((a, s) => a + billTotal(s), 0);
    const [mode, setMode] = useState<PayMode>(adm.payerType === "insurance" ? "insurance" : "cash");
    const settleDischarge = () => {
        if (unpaid.length)
            settleBills(unpaid.map((s) => s.id), mode);
        dischargePatient(adm.id);
        onClose();
    };
    const dischargeOnly = () => {
        dischargePatient(adm.id);
        onClose();
    };
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box className="!flex !max-h-[90vh] !w-full !max-w-[720px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop" onClick={stopPropagationOnClick}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Box>
            <Heading level={3}>
              {adm.name}{" "}
              <Text className={cn("!text-muted", "!font-semibold !text-[13px]")} as="span">
                · {adm.bed}
              </Text>
            </Heading>
            <Text as="span" className="text-[11px] font-semibold !text-muted">
              {adm.patientId} · {adm.wardName} · admitted {daysIn(adm.admittedAt, now)}d ago (
              {fmtDateTime(adm.admittedAt)})
            </Text>
          </Box>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          {/* patient facts */}
          <Box className={cn("!text-[12.5px] !text-muted ", "!mt-0")}>
            <Box>
              <Text as="span">Attending</Text>
              <Text as="span" className="font-bold text-[12.5px] font-bold text-ink">{adm.doctor || "—"}</Text>
            </Box>
            <Box>
              <Text as="span">Diagnosis</Text>
              <Text as="span" className="font-bold text-[12.5px] font-bold text-ink">{adm.diagnosis || "—"}</Text>
            </Box>
            <Box>
              <Text as="span">Payer</Text>
              <Text as="span" className="font-bold text-[12.5px] font-bold text-ink">{adm.payerType === "insurance" ? (adm.insurer ?? "Insurance") : "Self-pay"}</Text>
            </Box>
            <Box>
              <Text as="span">{adm.payerType === "insurance" ? "Policy no." : "Phone"}</Text>
              <Text as="span" className="font-bold !font-mono text-[12.5px] font-bold text-ink">
                {adm.payerType === "insurance" ? adm.policyNo || "—" : adm.phone || "—"}
              </Text>
            </Box>
          </Box>

          <Box className={cn("!mb-3.5 !flex !flex-wrap !gap-2.5", "!my-4 !mx-0")}>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Bills<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{bills.length}</Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Total<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{inr(total)}</Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Settled<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{inr(total - outstanding)}</Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Outstanding<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{inr(outstanding)}</Text>
            </Box>
          </Box>

          <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mb-2")}>
            <Text as="span" className="font-bold">Medicine bills</Text>
            <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={startWardBillingOnClick}>
              <IconPos size={14}/> Bill medicines
            </Button>
          </Box>
          <Box className="!overflow-x-auto">
            <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Invoice</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Items</TableHeaderCell>
                  <TableHeaderCell>Payment</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Amount</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.map(renderBill)}
                {bills.length === 0 && (<TableRow>
                    <TableCell colSpan={6}>
                      <Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink", "!p-4.5")}>
                        No bills yet — use “Bill medicines”.
                      </Box>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </Box>

          {/* final settlement */}
          <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!mt-4 !bg-wash-2")}>
            <Box className={cn("!flex !items-center !gap-2.5", "!justify-between", outstanding > 0 ? "!mb-2.5" : "!mb-0")}>
              <Text as="span" className="font-bold">Final bill & discharge</Text>
              <Text className={cn("!font-display !font-extrabold", outstanding > 0 ? "!text-rose" : "!text-mid")} as="span">
                {inr(outstanding)} due
              </Text>
            </Box>
            {outstanding > 0 ? (<>
                <Box className={cn("!flex !items-center !gap-1.5", "!mb-3 !flex-wrap")}>
                  {SETTLE_MODES.map(renderSETTLEMODES)}
                </Box>
                <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-sm !px-[22px] !py-[13px] !text-[14.5px] !w-full" onClick={settleDischarge}>
                  <IconRupee size={16}/> Settle {inr(outstanding)} ({PAY_LABEL[mode]}) & discharge
                </Button>
              </>) : (<Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-sm !px-[22px] !py-[13px] !text-[14.5px] !w-full" onClick={dischargeOnly}>
                <IconCheck size={16}/> Discharge patient · free bed {adm.bed}
              </Button>)}
          </Box>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function startWardBillingOnClick() {
        startWardBilling(adm);
        onClose();
    }
    function renderBill(s: Sale) {
        return (<TableRow key={s.id}>
                    <TableCell className={cn("!font-mono", "!font-bold")}>
                      {s.id}
                    </TableCell>
                    <TableCell className={cn("!whitespace-nowrap")}>{fmtDateTime(s.createdAt)}</TableCell>
                    <TableCell>
                      {s.items.length}
                      <Box className={cn("!text-muted", "!text-[11px]")}>
                        {s.items
                .map(matchItem)
                .join(", ")
                .slice(0, 36)}
                      </Box>
                    </TableCell>
                    <TableCell>{PAY_LABEL[s.payMode]}</TableCell>
                    <TableCell>
                      <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${s.paid === false ?"!bg-rose-bg !text-rose" :"!bg-wash !text-mid"}`} as="span">
                        {s.paid === false ? "Unpaid" : "Paid"}
                      </Text>
                    </TableCell>
                    <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-extrabold")}>
                      {inr(billTotal(s))}
                    </TableCell>
                  </TableRow>);
        function matchItem(i: SaleItem) {
            return i.name;
        }
    }
    function renderSETTLEMODES(m: PayMode) {
        return (<Button key={m} className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${mode === m ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setModeOnClick}>
                      {PAY_LABEL[m]}
                    </Button>);
        function setModeOnClick() {
            return setMode(m);
        }
    }
}
