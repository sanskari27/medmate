import type { MedicineDetailModalProps } from "./MedicineDetailModal.types";
import type { Batch } from "@/utils";
import { Box, Button, Heading, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { TableFooter } from "@/components/molecules/DataTable";
import { cn } from "@/utils/className";
import type { MouseEvent } from "react";
import { InvProduct, stockOf, hasLocation, locationCodes, inr, inr2, stockValue, looseUnitsOf, monthsToExpiry, isExpired, catLabel, unitNoun, stockLabel, } from "@/utils";
import { Thumb } from "@/components/Thumb";
import { ScheduleTag } from "@/components/ScheduleTag";
import { IconX, IconPin, IconBox, IconUnlock, IconReceipt, IconTag } from "@/components/Icon";
export function MedicineDetailModal({ p, now, onClose, }: MedicineDetailModalProps) {
    const mrpValue = p.batches.reduce((a, b) => a + b.qty * b.mrp, 0);
    const buyValue = stockValue(p);
    const totalQty = stockOf(p);
    const facts: [
        string,
        React.ReactNode
    ][] = [
        ["Composition / salt", p.composition],
        ["Manufacturer", p.manufacturer],
        ["Pack", p.pack],
        ["Category", catLabel(p.category)],
        ["Form", p.form],
        ["HSN", p.hsn],
        ["GST", `${p.gst}%`],
        [
            "Rack location",
            hasLocation(p) ? <Text className="!font-mono" as="span">{locationCodes(p).join(" · ")}</Text> : "—",
        ],
        ["Reorder level", `${p.reorderLevel} units`],
    ];
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box className="!flex !max-h-[90vh] !w-full !max-w-[720px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop" onClick={stopPropagationOnClick}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading className={cn("!flex !items-center !gap-2.5", "!gap-2.5 !items-center")} level={3}>
            <Text className={cn("grid h-[30px] w-[30px] shrink-0 place-items-center overflow-hidden rounded-[7px] bg-wash text-base text-mid", "!w-[34px] !h-[34px] !rounded-[9px] !bg-wash !grid !place-items-center !overflow-hidden")} as="span">
              <Thumb p={p}/>
            </Text>
            {p.name}{" "}
            {hasLocation(p) && (<Text className="!inline-flex !items-center !rounded-full !bg-wash !px-2 !py-0.5 !text-[11px] !font-bold !text-mid" as="span">
                <IconPin size={11}/> {p.rack}
              </Text>)}{" "}
            <ScheduleTag schedule={p.schedule}/>
          </Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          {/* value summary */}
          <Box className={cn("!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4", "!mb-4")}>
            <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
              <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
                <IconBox size={18}/>
              </Box>
              <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">In stock</Box>
              <Box className={cn("!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums", "!text-[18px]")}>
                {stockLabel(p)}
              </Box>
              <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">total units</Box>
            </Box>
            <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
              <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
                <IconUnlock size={18}/>
              </Box>
              <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Loose {unitNoun(p)}s</Box>
              <Box className={cn("!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums", "!text-[18px]")}>
                {looseUnitsOf(p)}
              </Box>
              <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">opened strips</Box>
            </Box>
            <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
              <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
                <IconReceipt size={18}/>
              </Box>
              <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Purchase value (cost)</Box>
              <Box className={cn("!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums", "!text-[18px]")}>
                {inr(buyValue)}
              </Box>
              <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">what you paid</Box>
            </Box>
            <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
              <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-rose-bg !text-rose">
                <IconTag size={18}/>
              </Box>
              <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">MRP value</Box>
              <Box className={cn("!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums", "!text-[18px]")}>
                {inr(mrpValue)}
              </Box>
              <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">retail value</Box>
            </Box>
          </Box>

          {/* details grid */}
          <Box className="!grid !grid-cols-2 !gap-2 !text-[12.5px]">
            {facts.map(renderFact)}
          </Box>

          {/* batch table */}
          <Text as="span" className={cn("font-bold", "!text-[13px] !block !mt-4 !mx-0 !mb-2")}>
            Batches · stock, expiry & value
          </Text>
          <Box className="!overflow-x-auto">
            <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Batch no.</TableHeaderCell>
                  <TableHeaderCell>Expiry</TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Qty</TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">MRP</TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Purchase / PTR</TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">MRP value</TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Purchase value</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {p.batches.length === 0 && (<TableRow>
                    <TableCell colSpan={7}>
                      <Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink", "!p-4")}>
                        <Text>No batches in stock.</Text>
                      </Box>
                    </TableCell>
                  </TableRow>)}
                {p.batches.map(renderBatche)}
              </TableBody>
            </Table>
            {p.batches.length > 0 && (
              <TableFooter className="flex flex-wrap items-center justify-between gap-3">
                <Text>Total · {p.batches.length} batch{p.batches.length !== 1 ? "es" : ""}</Text>
                <Text className="tabular-nums">{totalQty}</Text>
                <Text className="tabular-nums">{inr(mrpValue)}</Text>
                <Text className="tabular-nums">{inr(buyValue)}</Text>
              </TableFooter>
            )}
          </Box>
          <Text className={cn("!text-muted", "!text-[11.5px] !mt-2.5")}>
            Purchase value = stock × purchase price (PTR). MRP value = stock × MRP. Stock updates
            automatically from purchases & sales.
          </Text>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function renderFact([k, v]: [
        string,
        React.ReactNode
    ]) {
        return (<Box className="flex flex-col gap-0.5 bg-white px-3 py-[9px]" key={k}>
                <Text className="text-[10.5px] font-bold uppercase tracking-[0.04em] text-faint" as="span">{k}</Text>
                <Text className="text-[13px] font-semibold text-ink" as="span">{v}</Text>
              </Box>);
    }
    function renderBatche(b: Batch) {
        const mo = monthsToExpiry(b.expiry, now);
        const exp = isExpired(b.expiry, now);
        return (<TableRow key={b.batchNo}>
                      <TableCell className={cn("!font-mono", "!font-bold")}>
                        {b.batchNo || "—"}
                      </TableCell>
                      <TableCell>
                        <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${exp ?"!bg-rose-bg !text-rose" : mo <= 4 ?"!bg-amber-bg !text-gold-d" :"!bg-gray-pill !text-muted"}`} as="span">
                          {b.expiry}
                          {exp ? " · expired" : mo <= 4 ? ` · ${mo}mo` : ""}
                        </Text>
                      </TableCell>
                      <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-bold")}>
                        {b.qty}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-ink">{inr(b.mrp)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-ink">{inr2(b.ptr)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-ink">{inr(b.qty * b.mrp)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-ink">{inr(b.qty * b.ptr)}</TableCell>
                    </TableRow>);
    }
}
