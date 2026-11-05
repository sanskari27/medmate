import type { SupplyModalProps } from "./SupplyModal.types";
import type { Supplier } from "@/utils";
import { Box, Button, Heading, Input, Label, Select, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { SupplyEntry, InvProduct, inr2, effectiveSupplyPrice, schemeLabel, isDevice, mrpOf, } from "@/utils";
import { IconX, IconCheck } from "@/components/Icon";
export function SupplyModal({ init, onClose, onSave, }: SupplyModalProps) {
    const { inventory, suppliers, supplyList } = usePharma();
    const [f, setF] = useState<Omit<SupplyEntry, "id">>(init
        ? { ...init }
        : {
            productId: inventory[0]?.id ?? "",
            supplierId: suppliers[0]?.id ?? "",
            purchasePrice: 0,
            mrp: undefined,
            bonusBuy: undefined,
            bonusFree: undefined,
            preferred: false,
            note: "",
        });
    const set = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));
    const prod: InvProduct | undefined = inventory.find((p) => p.id === f.productId);
    const others = supplyList.filter((e) => e.productId === f.productId && e.id !== init?.id);
    const rankedOthers = others.slice().sort(function byLanded(left, right) {
        return effectiveSupplyPrice(left) - effectiveSupplyPrice(right);
    });
    const bestOther = rankedOthers.length
        ? Math.min(...rankedOthers.map(function landed(entry) { return effectiveSupplyPrice(entry); }))
        : null;
    const landedGap = f.purchasePrice > 0 && bestOther !== null
        ? bestOther - effectiveSupplyPrice(f as SupplyEntry)
        : null;
    // when picking a product, default MRP to its printed MRP for convenience
    const onPickProduct = (id: string) => {
        const p = inventory.find((x) => x.id === id);
        set({ productId: id, mrp: f.mrp ?? (p ? mrpOf(p) : undefined) });
    };
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box onClick={stopPropagationOnClick} className={cn("!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop", "!max-w-[560px]")}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>{init ? "Edit supply item" : "Add supply item"}</Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Medicine / device *</Label>
              <Select className="" value={f.productId} onChange={onPickProductOnChange} options={[...(inventory.map(renderInventory))]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Distributor *</Label>
              <Select className="" value={f.supplierId} onChange={setOnChange} options={[...(suppliers.map(renderSupplier))]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="amount">
              <Label>Purchase price ₹ (per pack) *</Label>
              <Input className="" type="number" step="0.01" value={f.purchasePrice || ""} onChange={setOnChange2}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>MRP ₹ (per pack)</Label>
              <Input className="" type="number" step="0.01" value={f.mrp ?? ""} onChange={setOnChange3}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Bonus — buy</Label>
              <Input className="" type="number" value={f.bonusBuy ?? ""} onChange={setOnChange4} placeholder="e.g. 10"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>… get free</Label>
              <Input className="" type="number" value={f.bonusFree ?? ""} onChange={setOnChange5} placeholder="e.g. 1"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Note (credit / shipping)</Label>
              <Input className="" value={f.note || ""} onChange={setOnChange6} placeholder="e.g. free shipping above ₹5000"/>
            </Box>
          </Box>
          {f.purchasePrice > 0 && schemeLabel(f as SupplyEntry) && (<Box className={cn("!mt-2 !text-[12px] !font-bold !text-primary")}>
              Landed cost after {schemeLabel(f as SupplyEntry)} scheme:{" "}
              {inr2(effectiveSupplyPrice(f as SupplyEntry))} / pack
            </Box>)}

          {others.length > 0 && (<Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!mt-3.5 !bg-wash-2")}>
              <Box className={cn("!text-[12px] !font-bold !text-ink-2 !mb-1.5")}>
                {prod?.name} is also supplied by:
              </Box>
              <Box className={cn("!flex !items-center !gap-2.5", "!flex-wrap !gap-1.5")}>
                {rankedOthers.map(renderO)}
              </Box>
              {landedGap !== null && (landedGap >= 0 ? (<Box className={cn("!mt-2 !text-[12px] !font-bold !text-primary")}>
                      <IconCheck size={13}/> Lowest landed price — {inr2(landedGap)}{" "}
                      cheaper than the next.
                    </Box>) : (<Box className={cn("!mt-2 !text-[12px] !text-mid")}>
                      {inr2(-landedGap)} more than the cheapest current source (landed).
                    </Box>))}
            </Box>)}

          <Box className={cn("!flex !items-center !gap-2.5", "!mt-4 !gap-2.5 !items-center")}>
            <Button type="button" className={`!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !bg-[#cddcd3] !p-0 !shadow-none after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow after:!transition after:!content-['']${f.preferred ? "!bg-mid after:!translate-x-4" : ""}`} onClick={setOnClick} aria-label="Toggle preferred"/>
            <Text className={cn("!text-[13px] !font-semibold")} as="span">
              Mark as preferred source for this item
            </Text>
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onClose}>
            Cancel
          </Button>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={!f.productId || !f.supplierId || f.purchasePrice <= 0} onClick={onSaveOnClick}>
            {init ? "Save changes" : "Add supply item"}
          </Button>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function onPickProductOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return onPickProduct(e.target.value);
    }
    function renderInventory(p: InvProduct) {
        return { value: String(p.id), label: String(p.name) + " \u2014 " + String(p.pack) + " " + String(isDevice(p) ? " (device)" : "") };
    }
    function setOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return set({ supplierId: e.target.value });
    }
    function renderSupplier(s: Supplier) {
        return { value: String(s.id), label: String(s.name) };
    }
    function setOnChange2(e: ChangeEvent<HTMLInputElement>) {
        return set({ purchasePrice: Number(e.target.value) || 0 });
    }
    function setOnChange3(e: ChangeEvent<HTMLInputElement>) {
        return set({ mrp: e.target.value === "" ? undefined : Number(e.target.value) });
    }
    function setOnChange4(e: ChangeEvent<HTMLInputElement>) {
        return set({ bonusBuy: e.target.value === "" ? undefined : Number(e.target.value) });
    }
    function setOnChange5(e: ChangeEvent<HTMLInputElement>) {
        return set({ bonusFree: e.target.value === "" ? undefined : Number(e.target.value) });
    }
    function setOnChange6(e: ChangeEvent<HTMLInputElement>) {
        return set({ note: e.target.value });
    }
    function renderO(o: SupplyEntry) {
        return (<Text key={o.id} className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-gray-pill !text-muted" as="span">
                      {suppliers.find(matchSupplier)?.name} ·{" "}
                      {inr2(effectiveSupplyPrice(o))}
                      {schemeLabel(o) ? ` (${schemeLabel(o)})` : ""}
                    </Text>);
        function matchSupplier(s: Supplier) {
            return s.id === o.supplierId;
        }
    }
    function setOnClick() {
        return set({ preferred: !f.preferred });
    }
    function onSaveOnClick() {
        return onSave(f);
    }
}
