import type { SalesRegisterProps } from "./SalesRegister.types";
import { Box, Button, Input, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { TableFooter } from "@/components/molecules/DataTable";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { inr, PAY_LABEL, PayMode, Channel, OrderStatus, STATUS_LABEL, fmtDateTime } from "@/utils";
import { IconSearch } from "@/components/atoms";
type SSort = "date" | "total" | "items" | "customer";
export function SalesRegister({ enriched }: SalesRegisterProps) {
    const [q, setQ] = useState("");
    const [chan, setChan] = useState<"all" | Channel>("all");
    const [pay, setPay] = useState<"all" | PayMode>("all");
    const [status, setStatus] = useState<"all" | OrderStatus>("all");
    const [rxOnly, setRxOnly] = useState(false);
    const [sort, setSort] = useState<SSort>("date");
    const [dir, setDir] = useState<"asc" | "desc">("desc");
    const toggle = (k: SSort) => {
        if (sort === k)
            setDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSort(k);
            setDir("desc");
        }
    };
    let rows = enriched.filter(({ s }) => {
        if (chan !== "all" && s.channel !== chan)
            return false;
        if (pay !== "all" && s.payMode !== pay)
            return false;
        if (status !== "all" && s.status !== status)
            return false;
        if (rxOnly && !s.rx)
            return false;
        if (q &&
            !`${s.id} ${s.customer.name} ${s.customer.phone ?? ""}`
                .toLowerCase()
                .includes(q.toLowerCase()))
            return false;
        return true;
    });
    rows = [...rows].sort((a, b) => {
        const m = dir === "asc" ? 1 : -1;
        if (sort === "total")
            return (a.t.payable - b.t.payable) * m;
        if (sort === "items")
            return ((a.s.items.reduce((x: number, i: any) => x + i.qty, 0) -
                b.s.items.reduce((x: number, i: any) => x + i.qty, 0)) *
                m);
        if (sort === "customer")
            return a.s.customer.name.localeCompare(b.s.customer.name) * m;
        return (a.s.createdAt - b.s.createdAt) * m;
    });
    const tGross = rows.reduce((a, r) => a + r.t.gross, 0);
    const tDisc = rows.reduce((a, r) => a + r.t.discount, 0);
    const tTax = rows.reduce((a, r) => a + r.t.totalTax, 0);
    const tNet = rows.reduce((a, r) => a + r.t.payable, 0);
    const ar = (k: SSort) => (sort === k ? (dir === "asc" ? "▲" : "▼") : "");
    return (<>
      <Box className="!mb-3.5 !flex !flex-wrap !gap-2.5">
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Bills<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{rows.length}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Gross<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{inr(tGross)}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Discounts<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{inr(tDisc)}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          GST<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{inr(tTax)}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Net collected<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{inr(tNet)}</Text>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5 print:hidden">
        <Box className="!flex !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none">
          <Text className="!text-green" as="span">
            <IconSearch size={17}/>
          </Text>
          <Input placeholder="Invoice, customer, phone…" value={q} onChange={setQOnChange}/>
        </Box>
        <Select value={chan} onChange={setChanOnChange} className={cn("", "!w-[130px]")} options={[{ value: "all", label: "All channels" }, { value: "online", label: "Online" }, { value: "offline", label: "Counter" }]} />
        <Select value={pay} onChange={setPayOnChange} className={cn("", "!w-[120px]")} options={[{ value: "all", label: "All payments" }, ...(["cash", "upi", "card", "cod"] as PayMode[]).map(renderM)]} />
        <Select value={status} onChange={setStatusOnChange} className={cn("", "!w-[130px]")} options={[{ value: "all", label: "All statuses" }, ...(["new", "accepted", "packed", "out", "delivered", "completed"] as OrderStatus[]).map(render)]} />
        <Button className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${rxOnly ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setRxOnlyOnClick}>
          ℞ Rx only
        </Button>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Invoice</TableHeaderCell>
                <TableHeaderCell className={sort === "date" ? "!cursor-pointer !select-none !text-mid" : "!cursor-pointer !select-none hover:!text-mid"} onClick={toggleOnClick}>
                  Date / time<Text className="!ml-[3px] !text-[9px] !opacity-90" as="span">{ar("date")}</Text>
                </TableHeaderCell>
                <TableHeaderCell className={sort === "customer" ? "!cursor-pointer !select-none !text-mid" : "!cursor-pointer !select-none hover:!text-mid"} onClick={toggleOnClick2}>
                  Customer<Text className="!ml-[3px] !text-[9px] !opacity-90" as="span">{ar("customer")}</Text>
                </TableHeaderCell>
                <TableHeaderCell>Channel</TableHeaderCell>
                <TableHeaderCell className={sort === "items" ? "!cursor-pointer !select-none !text-right !tabular-nums !font-semibold !text-mid" : "!cursor-pointer !select-none hover:!text-mid !text-right !tabular-nums !font-semibold !text-ink"} onClick={toggleOnClick3}>
                  Units<Text className="!ml-[3px] !text-[9px] !opacity-90" as="span">{ar("items")}</Text>
                </TableHeaderCell>
                <TableHeaderCell>Payment</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">Disc.</TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">Taxable</TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">GST</TableHeaderCell>
                <TableHeaderCell className={sort === "total" ? "!cursor-pointer !select-none !text-right !tabular-nums !font-semibold !text-mid" : "!cursor-pointer !select-none hover:!text-mid !text-right !tabular-nums !font-semibold !text-ink"} onClick={toggleOnClick4}>
                  Total<Text className="!ml-[3px] !text-[9px] !opacity-90" as="span">{ar("total")}</Text>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(renderSaleRow)}
              {rows.length === 0 && (<TableRow>
                  <TableCell colSpan={11}>
                    <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconSearch size={30}/>
                      </Box>
                      <Text>No sales match these filters.</Text>
                    </Box>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
          {rows.length > 0 && (
            <TableFooter className="flex flex-wrap items-center justify-between gap-3">
              <Text>Total · {rows.length} bills</Text>
              <Text className="tabular-nums">{inr(tDisc)}</Text>
              <Text className="tabular-nums">{inr(taxableSum(rows))}</Text>
              <Text className="tabular-nums">{inr(tTax)}</Text>
              <Text className="tabular-nums">{inr(tNet)}</Text>
            </TableFooter>
          )}
        </Box>
      </Box>
    </>);
    function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setQ(e.target.value);
    }
    function setChanOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return setChan(e.target.value as any);
    }
    function setPayOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return setPay(e.target.value as any);
    }
    function renderM(m: PayMode) {
        return { value: String(m), label: String(PAY_LABEL[m]) };
    }
    function setStatusOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return setStatus(e.target.value as any);
    }
    function render(s: OrderStatus) {
        return { value: String(s), label: String(STATUS_LABEL[s]) };
    }
    function setRxOnlyOnClick() {
        return setRxOnly((v) => !v);
    }
    function toggleOnClick() {
        return toggle("date");
    }
    function toggleOnClick2() {
        return toggle("customer");
    }
    function toggleOnClick3() {
        return toggle("items");
    }
    function toggleOnClick4() {
        return toggle("total");
    }
}

function sumQty(total: number, item: { qty: number }) {
    return total + item.qty;
}

function lineQty(items: { qty: number }[]) {
    return items.reduce(sumQty, 0);
}

function sumTaxable(total: number, entry: { t: { taxable: number } }) {
    return total + entry.t.taxable;
}

function taxableSum(entries: { t: { taxable: number } }[]) {
    return entries.reduce(sumTaxable, 0);
}

function SaleRegisterRow({ s, t }: { s: any; t: any }) {
    return (
        <TableRow>
            <TableCell className={cn("!font-mono", "!font-bold")}>
                {s.id}
                {s.rx && (<Text className={cn("!inline-flex !items-center !gap-1 !rounded-xs !border !border-line-2 !bg-paper !px-[7px] !py-0.5 !text-[10.5px] !font-bold !text-ink-2 !border-[#f3c7c7] !bg-rose-bg !text-rose", "!ml-[5px]")} as="span">
                    Rx
                </Text>)}
            </TableCell>
            <TableCell className={cn("!whitespace-nowrap")}>{fmtDateTime(s.createdAt)}</TableCell>
            <TableCell>{s.customer.name}</TableCell>
            <TableCell>
                {s.channel === "online" ? (<Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-blue-bg !text-blue" as="span">Online</Text>) : (<Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-gray-pill !text-muted" as="span">Counter</Text>)}
            </TableCell>
            <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">{lineQty(s.items)}</TableCell>
            <TableCell>{PAY_LABEL[s.payMode as PayMode]}</TableCell>
            <TableCell>{STATUS_LABEL[s.status as OrderStatus]}</TableCell>
            <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">{t.discount > 0 ? inr(t.discount) : "—"}</TableCell>
            <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">{inr(t.taxable)}</TableCell>
            <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">{inr(t.totalTax)}</TableCell>
            <TableCell className={cn("!text-right !tabular-nums !font-semibold !text-ink", "!font-extrabold")}>
                {inr(t.payable)}
            </TableCell>
        </TableRow>
    );
}

function renderSaleRow(row: { s: any; t: any }) {
    return <SaleRegisterRow key={row.s.id} s={row.s} t={row.t} />;
}
