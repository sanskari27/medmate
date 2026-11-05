import type { ProductsReportProps } from "./ProductsReport.types";
import type { CategoryKey } from "@/utils";
import { Box, Input, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { inr, catLabel, CATEGORIES, stockOf } from "@/utils";
import { IconSearch, IconBox } from "@/components/atoms";
import { monogramOf } from "@/components/molecules";
type PSort = "units" | "revenue" | "profit" | "margin" | "stock";
export function ProductsReport({ enriched, inventory, costOf, }: ProductsReportProps) {
    const [cat, setCat] = useState("all");
    const [q, setQ] = useState("");
    const [sort, setSort] = useState<PSort>("revenue");
    const [dir, setDir] = useState<"asc" | "desc">("desc");
    const toggle = (k: PSort) => {
        if (sort === k)
            setDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSort(k);
            setDir("desc");
        }
    };
    // aggregate per product
    const agg = new Map<string, {
        id: string;
        name: string;
        units: number;
        revenue: number;
        cogs: number;
    }>();
    enriched.forEach((r: any) => r.s.items.forEach((i: any) => {
        const ex = (i.price * i.qty) / (1 + i.gst / 100);
        const cur = agg.get(i.productId) ?? {
            id: i.productId,
            name: i.name,
            units: 0,
            revenue: 0,
            cogs: 0,
        };
        cur.units += i.qty;
        cur.revenue += ex;
        cur.cogs += costOf(i.productId) * i.qty;
        agg.set(i.productId, cur);
    }));
    let rows = [...agg.values()].map((a) => {
        const p = inventory.find((x) => x.id === a.id);
        const profit = a.revenue - a.cogs;
        const margin = a.revenue > 0 ? (profit / a.revenue) * 100 : 0;
        const stock = p ? stockOf(p) : 0;
        return { ...a, profit, margin, stock, category: p?.category ?? "—" };
    });
    rows = rows.filter((r) => (cat === "all" || r.category === cat) &&
        (!q || r.name.toLowerCase().includes(q.toLowerCase())));
    rows.sort((a, b) => {
        const m = dir === "asc" ? 1 : -1;
        if (sort === "units")
            return (a.units - b.units) * m;
        if (sort === "profit")
            return (a.profit - b.profit) * m;
        if (sort === "margin")
            return (a.margin - b.margin) * m;
        if (sort === "stock")
            return (a.stock - b.stock) * m;
        return (a.revenue - b.revenue) * m;
    });
    const ar = (k: PSort) => (sort === k ? (dir === "asc" ? "▲" : "▼") : "");
    // not-sold (dead stock) in this window
    const soldIds = new Set(agg.keys());
    const notSold = inventory.filter((p) => !soldIds.has(p.id)).length;
    const unitTotal = rows.reduce(addUnits, 0);
    const revenueTotal = rows.reduce(addRevenue, 0);
    const profitTotal = rows.reduce(addProfit, 0);
    function addUnits(sum: number, row: (typeof rows)[number]) {
        return sum + row.units;
    }
    function addRevenue(sum: number, row: (typeof rows)[number]) {
        return sum + row.revenue;
    }
    function addProfit(sum: number, row: (typeof rows)[number]) {
        return sum + row.profit;
    }
    return (<>
      <Box className="!mb-3.5 !flex !flex-wrap !gap-2.5">
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Products sold<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{agg.size}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Units<Text as="span" className="mt-px block font-display text-[15px] font-bold text-dark">{unitTotal}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Revenue (ex-GST)<Text as="span" className="mt-px block font-display text-[15px] font-bold text-dark">{inr(revenueTotal)}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Gross profit<Text as="span" className="mt-px block font-display text-[15px] font-bold text-dark">{inr(profitTotal)}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          No sales (window)<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{notSold}</Text>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5 print:hidden">
        <Box className="!flex !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none">
          <Text className="!text-green" as="span">
            <IconSearch size={17}/>
          </Text>
          <Input placeholder="Search product…" value={q} onChange={setQOnChange}/>
        </Box>
        <Select value={cat} onChange={setCatOnChange} className={cn("", "!w-[160px]")} options={[{ value: "all", label: "All categories" }, ...CATEGORIES.map(renderCATEGORIES)]} />
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell className={sort === "units" ? "!cursor-pointer !select-none !text-right !tabular-nums !font-semibold !text-mid" : "!cursor-pointer !select-none hover:!text-mid !text-right !tabular-nums !font-semibold !text-ink"} onClick={toggleOnClick}>
                  Units<Text className="!ml-[3px] !text-[9px] !opacity-90" as="span">{ar("units")}</Text>
                </TableHeaderCell>
                <TableHeaderCell className={sort === "revenue" ? "!cursor-pointer !select-none !text-right !tabular-nums !font-semibold !text-mid" : "!cursor-pointer !select-none hover:!text-mid !text-right !tabular-nums !font-semibold !text-ink"} onClick={toggleOnClick2}>
                  Revenue<Text className="!ml-[3px] !text-[9px] !opacity-90" as="span">{ar("revenue")}</Text>
                </TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">COGS</TableHeaderCell>
                <TableHeaderCell className={sort === "profit" ? "!cursor-pointer !select-none !text-right !tabular-nums !font-semibold !text-mid" : "!cursor-pointer !select-none hover:!text-mid !text-right !tabular-nums !font-semibold !text-ink"} onClick={toggleOnClick3}>
                  Profit<Text className="!ml-[3px] !text-[9px] !opacity-90" as="span">{ar("profit")}</Text>
                </TableHeaderCell>
                <TableHeaderCell className={sort === "margin" ? "!cursor-pointer !select-none !text-right !tabular-nums !font-semibold !text-mid" : "!cursor-pointer !select-none hover:!text-mid !text-right !tabular-nums !font-semibold !text-ink"} onClick={toggleOnClick4}>
                  Margin<Text className="!ml-[3px] !text-[9px] !opacity-90" as="span">{ar("margin")}</Text>
                </TableHeaderCell>
                <TableHeaderCell className={sort === "stock" ? "!cursor-pointer !select-none !text-right !tabular-nums !font-semibold !text-mid" : "!cursor-pointer !select-none hover:!text-mid !text-right !tabular-nums !font-semibold !text-ink"} onClick={toggleOnClick5}>
                  In stock<Text className="!ml-[3px] !text-[9px] !opacity-90" as="span">{ar("stock")}</Text>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(renderRow)}
              {rows.length === 0 && (<TableRow>
                  <TableCell colSpan={8}>
                    <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconBox size={30}/>
                      </Box>
                      <Text>No products sold in this period / filter.</Text>
                    </Box>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </>);
    function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setQ(e.target.value);
    }
    function setCatOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return setCat(e.target.value);
    }
    function renderCATEGORIES(c: {
        key: CategoryKey;
        label: string;
    }) {
        return { value: String(c.key), label: String(c.label) };
    }
    function toggleOnClick() {
        return toggle("units");
    }
    function toggleOnClick2() {
        return toggle("revenue");
    }
    function toggleOnClick3() {
        return toggle("profit");
    }
    function toggleOnClick4() {
        return toggle("margin");
    }
    function toggleOnClick5() {
        return toggle("stock");
    }
    function renderRow(r: {
        profit: number;
        margin: number;
        stock: number;
        category: any;
        id: string;
        name: string;
        units: number;
        revenue: number;
        cogs: number;
    }) {
        return (<TableRow key={r.id}>
                  <TableCell>
                    <Box className="flex items-center gap-2.5">
                      <Text className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] font-display font-bold leading-none text-mid" as="span">{monogramOf(r.name)}</Text>
                      <Text className="!font-bold !text-ink" as="span">{r.name}</Text>
                    </Box>
                  </TableCell>
                  <TableCell>{catLabel(r.category)}</TableCell>
                  <TableCell className={cn("!text-right !tabular-nums !font-semibold !text-ink", "!font-bold")}>
                    {r.units}
                  </TableCell>
                  <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">{inr(r.revenue)}</TableCell>
                  <TableCell className="!text-right !tabular-nums !font-semibold !text-ink !text-muted">{inr(r.cogs)}</TableCell>
                  <TableCell className={cn("!text-right !tabular-nums !font-semibold !text-ink", "!font-bold", r.profit >= 0 ? "!text-green" : "!text-rose")}>
                    {inr(r.profit)}
                  </TableCell>
                  <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">
                    <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${r.margin >= 30 ?"!bg-wash !text-mid" : r.margin >= 15 ?"!bg-amber-bg !text-gold-d" :"!bg-rose-bg !text-rose"}`} as="span">
                      {r.margin.toFixed(0)}%
                    </Text>
                  </TableCell>
                  <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">{r.stock}</TableCell>
                </TableRow>);
    }
}
