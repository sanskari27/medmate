import type { InvProduct } from "@/utils";
import { Box, Button, Heading, Input, Label, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { usePharma } from "@/hooks";
import { SupplyEntry, inr2, effectiveSupplyPrice, schemeLabel, isDevice } from "@/utils";
import { IconStar, IconScale, IconCash, IconTag, IconCheck } from "@/components/Icon";
import { Thumb } from "@/components/Thumb";
import { multiSourceCount } from "@/screens/Purchases/utils/multiSourceCount";
export function PriceCompare() {
    const { supplyList, suppliers, inventory } = usePharma();
    const [q, setQ] = useState("");
    const [onlyMulti, setOnlyMulti] = useState(true);
    const prodOf = (id: string) => inventory.find((p) => p.id === id);
    const supOf = (id: string) => suppliers.find((s) => s.id === id);
    // group supply rows by product
    const groups = useMemo(() => {
        const m: Record<string, SupplyEntry[]> = {};
        supplyList.forEach((e) => {
            (m[e.productId] ||= []).push(e);
        });
        return Object.entries(m)
            .map(([pid, rows]) => ({
            p: prodOf(pid),
            rows: rows.slice().sort((a, b) => effectiveSupplyPrice(a) - effectiveSupplyPrice(b)),
        }))
            .filter((g) => g.p)
            .filter((g) => !onlyMulti || g.rows.length > 1)
            .filter((g) => !q.trim() ||
            g.p!.name.toLowerCase().includes(q.toLowerCase()) ||
            g.p!.composition.toLowerCase().includes(q.toLowerCase()))
            .sort((a, b) => a.p!.name.localeCompare(b.p!.name));
    }, [supplyList, inventory, onlyMulti, q]);
    const totalSaving = groups.reduce((sum, g) => {
        if (g.rows.length < 2)
            return sum;
        return (sum + (effectiveSupplyPrice(g.rows[g.rows.length - 1]) - effectiveSupplyPrice(g.rows[0])));
    }, 0);
    return (<>
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
            <IconScale size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Comparable items</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{multiSourceCount(supplyList)}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">supplied by 2+ distributors</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconCash size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Saving per pack</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr2(totalSaving)}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">buying each at its lowest</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
            <IconTag size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Distributors compared</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{suppliers.length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">across your supply list</Box>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Heading className={cn("!text-[16px]")} level={2}>Purchase-price comparison</Heading>
        <Box className="!flex-1"/>
        <Label className={cn("!flex !items-center !gap-2.5", "!gap-2 !items-center !text-[12.5px] !font-semibold")}>
          <Button type="button" className={`!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !bg-[#cddcd3] !p-0 !shadow-none after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow after:!transition after:!content-['']${onlyMulti ? "!bg-mid after:!translate-x-4" : ""}`} onClick={setOnlyMultiOnClick} aria-label="Toggle"/>
          Only multi-source
        </Label>
        <Input placeholder="Search medicine…" value={q} onChange={setQOnChange} className={cn("", "!max-w-[220px]")}/>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Medicine / device</TableHeaderCell>
                <TableHeaderCell>Quotes from distributors (low → high)</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Best ₹</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Saving / pack</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map(renderGroup)}
              {groups.length === 0 && (<TableRow>
                  <TableCell colSpan={4}>
                    <Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink", "!p-7")}>
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconScale size={30}/>
                      </Box>
                      <Text>
                        {onlyMulti
                ? "No medicine is sourced from 2+ distributors yet. Add the same item under different distributors in the Supply list to compare prices."
                : "No supply items to compare."}
                      </Text>
                    </Box>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </>);
    function setOnlyMultiOnClick() {
        return setOnlyMulti((v) => !v);
    }
    function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setQ(e.target.value);
    }
    function renderGroup(g: {
        p: InvProduct | undefined;
        rows: SupplyEntry[];
    }) {
        const p = g.p!;
        const low = g.rows[0];
        const high = g.rows[g.rows.length - 1];
        const saving = g.rows.length > 1 ? effectiveSupplyPrice(high) - effectiveSupplyPrice(low) : 0;
        return (<TableRow key={p.id}>
                    <TableCell>
                      <Box className="flex items-center gap-2.5">
                        <Text className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] font-display font-bold leading-none text-mid" as="span">
                          <Thumb p={p}/>
                        </Text>
                        <Text as="span">
                          <Text className="!font-bold !text-ink" as="span">{p.name}</Text>
                          <Box className="text-[11.5px] text-muted">
                            {isDevice(p) ? "Device · " : ""}
                            {p.pack}
                          </Box>
                        </Text>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box className={cn("!flex !items-center !gap-2.5", "!flex-wrap !gap-1.5")}>
                        {g.rows.map(renderRow)}
                      </Box>
                    </TableCell>
                    <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-bold !text-primary")}>
                      {inr2(effectiveSupplyPrice(low))}
                    </TableCell>
                    <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-bold", saving > 0 ? "!text-primary" : "!text-mid")}>
                      {saving > 0 ? inr2(saving) : "—"}
                    </TableCell>
                  </TableRow>);
        function renderRow(r: SupplyEntry, i: number) {
            return (<Text key={r.id} title={schemeLabel(r)
                    ? `${inr2(r.purchasePrice)} list, ${schemeLabel(r)} scheme`
                    : i === 0
                        ? "Lowest landed price"
                        : undefined} className={cn(`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${i === 0 ?"!bg-wash !text-mid" :"!bg-gray-pill !text-muted"}`, "!gap-[5px]")} as="span">
                            {r.preferred && (<>
                                <IconStar size={12}/>{" "}
                              </>)}
                            {supOf(r.supplierId)?.name ?? "—"} · {inr2(effectiveSupplyPrice(r))}
                            {schemeLabel(r) ? ` (${schemeLabel(r)})` : ""}
                            {i === 0 && g.rows.length > 1 ? (<>
                                {" "}
                                <IconCheck size={12}/>
                              </>) : ("")}
                          </Text>);
        }
    }
}
