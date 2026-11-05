import type { MedicineDetailModalProps } from "./MedicineDetailModal.types";
import type { Batch } from "@/utils";
import {
  Box,
  Button,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import type { MouseEvent } from "react";
import {
  stockOf,
  hasLocation,
  locationCodes,
  inr,
  inr2,
  stockValue,
  looseUnitsOf,
  monthsToExpiry,
  isExpired,
  catLabel,
  unitNoun,
  stockLabel,
} from "@/utils";
import { Thumb } from "@/components/molecules";
import { ScheduleTag } from "@/components/molecules";
import { IconX, IconPin, IconBox, IconUnlock, IconReceipt, IconTag } from "@/components/atoms";

const modalMotion = `
@keyframes rackFade { from { opacity: 0 } }
@keyframes rackPop { from { transform: translateY(14px) scale(.98); opacity: .6 } }
.rack-fade { animation: rackFade .16s ease }
.rack-pop { animation: rackPop .2s cubic-bezier(.2,.9,.3,1.2) }
`;

export function MedicineDetailModal({ p, now, onClose }: MedicineDetailModalProps) {
  const mrpValue = p.batches.reduce((a, b) => a + b.qty * b.mrp, 0);
  const buyValue = stockValue(p);
  const totalQty = stockOf(p);
  const facts: [string, React.ReactNode][] = [
    ["Composition / salt", p.composition],
    ["Manufacturer", p.manufacturer],
    ["Pack", p.pack],
    ["Category", catLabel(p.category)],
    ["Form", p.form],
    ["HSN", p.hsn],
    ["GST", `${p.gst}%`],
    [
      "Rack location",
      hasLocation(p) ? (
        <Text className="!font-mono !text-[13px] !font-semibold !text-ink" as="span">
          {locationCodes(p).join(" · ")}
        </Text>
      ) : (
        "—"
      ),
    ],
    ["Reorder level", `${p.reorderLevel} units`],
  ];
  return (
    <Box
      className="rack-fade fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px] max-[767px]:items-end max-[767px]:p-0"
      onClick={onClose}
    >
      <style>{modalMotion}</style>
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={p.name}
        className="rack-pop flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop max-[767px]:max-h-[92dvh] max-[767px]:max-w-none max-[767px]:rounded-t-2xl max-[767px]:rounded-b-none"
        onClick={stopPropagationOnClick}
      >
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading
            className={cn("!flex !items-center !gap-2.5", "!gap-2.5 !items-center")}
            level={3}
          >
            <Text
              className={cn(
                "grid h-[30px] w-[30px] shrink-0 place-items-center overflow-hidden rounded-[7px] bg-wash text-base text-mid",
                "!w-[34px] !h-[34px] !rounded-[9px] !bg-wash !grid !place-items-center !overflow-hidden",
              )}
              as="span"
            >
              <Thumb p={p} />
            </Text>
            {p.name}{" "}
            {hasLocation(p) && (
              <Text
                className="!ml-1.5 !inline-flex !items-center !gap-0.5 !rounded-[5px] !bg-wash !px-[5px] !py-px !font-mono !text-[10px] !font-bold !whitespace-nowrap !text-mid"
                as="span"
              >
                <IconPin size={11} /> {p.rack}
              </Text>
            )}{" "}
            <ScheduleTag schedule={p.schedule} />
          </Heading>
          <Button
            className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash"
            onClick={onClose}
          >
            <IconX size={18} />
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          {/* value summary */}
          <Box
            className={cn(
              "!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4",
              "!mb-4",
            )}
          >
            <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
              <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
                <IconBox size={18} />
              </Box>
              <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
                In stock
              </Box>
              <Box
                className={cn(
                  "!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums",
                  "!text-[18px]",
                )}
              >
                {stockLabel(p)}
              </Box>
              <Box className="mt-auto block border-t border-line pt-[9px] text-[12px] leading-[1.5] text-muted">
                total units
              </Box>
            </Box>
            <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
              <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
                <IconUnlock size={18} />
              </Box>
              <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
                Loose {unitNoun(p)}s
              </Box>
              <Box
                className={cn(
                  "!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums",
                  "!text-[18px]",
                )}
              >
                {looseUnitsOf(p)}
              </Box>
              <Box className="mt-auto block border-t border-line pt-[9px] text-[12px] leading-[1.5] text-muted">
                opened strips
              </Box>
            </Box>
            <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
              <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
                <IconReceipt size={18} />
              </Box>
              <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
                Purchase value (cost)
              </Box>
              <Box
                className={cn(
                  "!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums",
                  "!text-[18px]",
                )}
              >
                {inr(buyValue)}
              </Box>
              <Box className="mt-auto block border-t border-line pt-[9px] text-[12px] leading-[1.5] text-muted">
                what you paid
              </Box>
            </Box>
            <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
              <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-rose-bg !text-rose">
                <IconTag size={18} />
              </Box>
              <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
                MRP value
              </Box>
              <Box
                className={cn(
                  "!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums",
                  "!text-[18px]",
                )}
              >
                {inr(mrpValue)}
              </Box>
              <Box className="mt-auto block border-t border-line pt-[9px] text-[12px] leading-[1.5] text-muted">
                retail value
              </Box>
            </Box>
          </Box>

          {/* details grid */}
          <Box className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line max-[767px]:grid-cols-2">
            {facts.map(renderFact)}
          </Box>

          {/* batch table */}
          <Text as="span" className={cn("font-bold", "!text-[13px] !block !mt-4 !mx-0 !mb-2")}>
            Batches · stock, expiry & value
          </Text>
          <Box className="!overflow-x-auto">
            <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_tr]:!border-0 [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-100 [&_tbody_tr:hover]:!bg-wash-2 [&_tbody:last-child_tr:last-child_td]:!border-b-0 [&_th]:!sticky [&_th]:!top-0 [&_th]:!z-[1] [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_tbody_td]:!border-b [&_tbody_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2 [&_tfoot_td]:!border-t-2 [&_tfoot_td]:!border-b-0 [&_tfoot_td]:!border-line-2 [&_tfoot_td]:!bg-wash-2 [&_tfoot_td]:!font-extrabold">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Batch no.</TableHeaderCell>
                  <TableHeaderCell>Expiry</TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">
                    Qty
                  </TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">
                    MRP
                  </TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">
                    Purchase / PTR
                  </TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">
                    MRP value
                  </TableHeaderCell>
                  <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">
                    Purchase value
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {p.batches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box className="p-4 text-center text-muted">
                        <Text className="!text-[13px] !text-muted">No batches in stock.</Text>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                {p.batches.map(renderBatche)}
              </TableBody>
              {p.batches.length > 0 ? (
                <tfoot>
                  <tr className="bg-wash-2 font-extrabold">
                    <td colSpan={2} className="px-3.5 py-[11px] text-[13px] text-ink-2">
                      Total · {p.batches.length} batch{p.batches.length !== 1 ? "es" : ""}
                    </td>
                    <td className="px-3.5 py-[11px] text-right text-[13px] text-ink-2 tabular-nums">
                      {totalQty}
                    </td>
                    <td colSpan={2} className="px-3.5 py-[11px]" />
                    <td className="px-3.5 py-[11px] text-right text-[13px] text-ink-2 tabular-nums">
                      {inr(mrpValue)}
                    </td>
                    <td className="px-3.5 py-[11px] text-right text-[13px] text-ink-2 tabular-nums">
                      {inr(buyValue)}
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </Table>
          </Box>
          <Text className={cn("!text-muted", "!text-[11.5px] !mt-2.5")}>
            Purchase value = stock × purchase price (PTR). MRP value = stock × MRP. Stock updates
            automatically from purchases & sales.
          </Text>
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function renderFact([k, v]: [string, React.ReactNode]) {
    return (
      <Box className="flex flex-col gap-0.5 bg-paper px-3 py-[9px]" key={k}>
        <Text className="text-[10.5px] font-bold uppercase tracking-[0.04em] text-faint" as="span">
          {k}
        </Text>
        <Text className="text-[13px] font-semibold text-ink" as="span">
          {v}
        </Text>
      </Box>
    );
  }
  function renderBatche(b: Batch) {
    const mo = monthsToExpiry(b.expiry, now);
    const exp = isExpired(b.expiry, now);
    return (
      <TableRow key={b.batchNo}>
        <TableCell className={cn("!font-mono", "!font-bold")}>{b.batchNo || "—"}</TableCell>
        <TableCell>
          <Text
            className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${exp ? "!bg-rose-bg !text-rose" : mo <= 4 ? "!bg-amber-bg !text-gold-d" : "!bg-gray-pill !text-muted"}`}
            as="span"
          >
            {b.expiry}
            {exp ? " · expired" : mo <= 4 ? ` · ${mo}mo` : ""}
          </Text>
        </TableCell>
        <TableCell className="!text-right !font-bold !text-ink-2 tabular-nums">{b.qty}</TableCell>
        <TableCell className="!text-right !font-semibold !text-ink-2 tabular-nums">
          {inr(b.mrp)}
        </TableCell>
        <TableCell className="!text-right !font-semibold !text-ink-2 tabular-nums">
          {inr2(b.ptr)}
        </TableCell>
        <TableCell className="!text-right !font-semibold !text-ink-2 tabular-nums">
          {inr(b.qty * b.mrp)}
        </TableCell>
        <TableCell className="!text-right !font-semibold !text-ink-2 tabular-nums">
          {inr(b.qty * b.ptr)}
        </TableCell>
      </TableRow>
    );
  }
}
