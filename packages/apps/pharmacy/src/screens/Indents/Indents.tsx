import type { IndentItem, WardIndent } from "@/utils";
import { Box, Button, Heading, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import { useState, useMemo } from "react";
import { usePharma } from "@/hooks";
import { fmtDateTime, inr } from "@/utils";
import { IndentStatus } from "@/utils/calculations/hospital";
import { reasonMeta } from "@/utils/calculations/hospitalAccount";
import { IconReceipt } from "@/components/Icon";
import { visibleIndents } from "./Indents.utils";
const TONE: Record<IndentStatus, string> = {
    pending: "!bg-amber-bg !text-gold-d",
    approved: "!bg-blue-bg !text-blue",
    issued: "!bg-wash !text-mid",
    rejected: "!bg-rose-bg !text-rose",
};
const LABEL: Record<IndentStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    issued: "Issued",
    rejected: "Rejected",
};
const FILTERS: ("all" | IndentStatus)[] = ["all", "pending", "approved", "issued", "rejected"];
export default function IndentsScreen() {
    const { wardIndents, setIndentStatus, wardSupplies, openIndentBilling } = usePharma();
    const supplyFor = (id: string) => wardSupplies.find((s) => s.indentId === id) ?? null;
    const [f, setF] = useState<"all" | IndentStatus>("all");
    const rows = useMemo(() => visibleIndents(wardIndents, f), [wardIndents, f]);
    const count = (s: IndentStatus) => wardIndents.filter((x) => x.status === s).length;
    return (<Box className="!mx-auto !max-w-[1680px]">
      <Box className={cn("!mb-3.5 !flex !flex-wrap !gap-2.5", "!mb-4")}>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Pending<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{count("pending")}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Approved<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{count("approved")}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Issued today<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{count("issued")}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Total indents<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{wardIndents.length}</Text>
        </Box>
      </Box>

      <Box className={cn("!mb-4 !flex !flex-wrap !items-center !gap-2.5", "!mb-3.5")}>
        <Box className="!flex !items-center !gap-1.5">
          {FILTERS.map(renderFILTERS)}
        </Box>
      </Box>

      <Box className="!grid !grid-cols-[repeat(auto-fill,minmax(280px,1fr))] !gap-3.5">
        {rows.map(renderRow)}
        {rows.length === 0 && <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">No indents in this view.</Box>}
      </Box>
    </Box>);
    function renderFILTERS(x: "all" | IndentStatus) {
        return (<Button key={x} className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${f === x ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setFOnClick}>
              {x === "all" ? "All" : LABEL[x]}
            </Button>);
        function setFOnClick() {
            return setF(x);
        }
    }
    function renderRow(ind: WardIndent) {
        const supply = supplyFor(ind.id);
        return (<Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]" key={ind.id}>
            <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !items-start")}>
              <Box>
                <Heading className={cn("!text-[15px]")} level={3}>{ind.wardName}</Heading>
                <Box className={cn("!text-muted", "!text-[12.5px] !mt-0.5")}>
                  {ind.id} · {ind.patient ?? "Ward stock"}
                </Box>
              </Box>
              <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${TONE[ind.status]}`} as="span">{LABEL[ind.status]}</Text>
            </Box>
            <Box className={cn("!text-muted", "!text-[12px] !mt-1.5")}>
              Requested by {ind.requestedBy} · {fmtDateTime(ind.at)}
            </Box>
            <Box className="!mt-2 !list-disc !pl-4 !text-[13px] !text-ink-2">
              {ind.items.map(renderItem)}
            </Box>
            {ind.note && (<Text className={cn("!text-muted", "!text-[12px] !italic !mt-1")}>
                “{ind.note}”
              </Text>)}
            {supply ? (<Box className="!mt-2 !flex !flex-wrap !items-center !gap-1.5 !text-[12.5px] !text-ink-2">
                  <IconReceipt size={14}/> Billed to hospital · <Text as="span" className="font-bold !font-mono">{supply.id}</Text>{" "}
                  · {inr(supply.total)}
                  <Text className="!text-muted" as="span">
                    {" "}
                    · {reasonMeta(supply.reason).tag} · {fmtDateTime(supply.at)}
                  </Text>
                </Box>) : null}
            <Box className={cn("!flex !items-center !gap-1.5", "!mt-3")}>
              {ind.status === "pending" && (<>
                  <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={setIndentStatusOnClick}>
                    Approve
                  </Button>
                  <Button onClick={setIndentStatusOnClick2} className={cn("!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs", "!text-rose")}>
                    Reject
                  </Button>
                </>)}
              {ind.status === "approved" && (<Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={openIndentBillingOnClick}>
                  <IconReceipt size={14}/> Issue &amp; bill to hospital
                </Button>)}
              {ind.status === "issued" &&
                (supplyFor(ind.id) ? (<Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={openIndentBillingOnClick2}>
                    View / re-bill
                  </Button>) : (<Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={openIndentBillingOnClick3}>
                    <IconReceipt size={14}/> Bill to hospital
                  </Button>))}
              {ind.status === "rejected" && (<Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={setIndentStatusOnClick3}>
                  Reopen
                </Button>)}
            </Box>
          </Box>);
        function renderItem(it: IndentItem, i: number) {
            return (<Box className="list-item" key={i}>
                  <Text as="span">{it.name}</Text>
                  <Text as="span" className="font-bold">
                    ×{it.qty}
                    {it.issued ? ` · issued ${it.issued}` : ""}
                  </Text>
                </Box>);
        }
        function setIndentStatusOnClick() {
            return setIndentStatus(ind.id, "approved");
        }
        function setIndentStatusOnClick2() {
            return setIndentStatus(ind.id, "rejected");
        }
        function openIndentBillingOnClick() {
            return openIndentBilling(ind.id);
        }
        function openIndentBillingOnClick2() {
            return openIndentBilling(ind.id);
        }
        function openIndentBillingOnClick3() {
            return openIndentBilling(ind.id);
        }
        function setIndentStatusOnClick3() {
            return setIndentStatus(ind.id, "pending");
        }
    }
}
