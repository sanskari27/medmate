import type { SupplyModalProps } from "./SupplyModal.types";
import type { Supplier } from "@/utils";
import { Box, Button, Heading, Input, Label, Switch, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import {
  ChevronSelect,
  closeButtonClass,
  fieldClass,
  formGridClass,
  modalBodyClass,
  modalFootClass,
  modalHeadClass,
  modalOverlayClass,
  modalPanelClass,
  span2Class,
} from "@/screens/Purchases/purchaseChrome";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import {
  SupplyEntry,
  InvProduct,
  inr2,
  effectiveSupplyPrice,
  schemeLabel,
  isDevice,
  mrpOf,
} from "@/utils";
import { IconX, IconCheck } from "@/components/atoms";
export function SupplyModal({ init, onClose, onSave }: SupplyModalProps) {
  const { inventory, suppliers, supplyList } = usePharma();
  const [f, setF] = useState<Omit<SupplyEntry, "id">>(
    init
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
        },
  );
  const set = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));
  const prod: InvProduct | undefined = inventory.find((p) => p.id === f.productId);
  const others = supplyList.filter((e) => e.productId === f.productId && e.id !== init?.id);
  const rankedOthers = others.slice().sort(function byLanded(left, right) {
    return effectiveSupplyPrice(left) - effectiveSupplyPrice(right);
  });
  const bestOther = rankedOthers.length
    ? Math.min(
        ...rankedOthers.map(function landed(entry) {
          return effectiveSupplyPrice(entry);
        }),
      )
    : null;
  const landedGap =
    f.purchasePrice > 0 && bestOther !== null
      ? bestOther - effectiveSupplyPrice(f as SupplyEntry)
      : null;
  // when picking a product, default MRP to its printed MRP for convenience
  const onPickProduct = (id: string) => {
    const p = inventory.find((x) => x.id === id);
    set({ productId: id, mrp: f.mrp ?? (p ? mrpOf(p) : undefined) });
  };
  return (
    <Box className={modalOverlayClass} onClick={onClose}>
      <Box onClick={stopPropagationOnClick} className={cn(modalPanelClass, "!max-w-[560px]")}>
        <Box className={modalHeadClass}>
          <Heading level={3}>{init ? "Edit supply item" : "Add supply item"}</Heading>
          <Button className={closeButtonClass} onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </Button>
        </Box>
        <Box className={modalBodyClass}>
          <Box className={formGridClass}>
            <Box className={cn(fieldClass, span2Class)}>
              <Label>Medicine / device *</Label>
              <ChevronSelect
                value={f.productId}
                onChange={onPickProductOnChange}
                options={[...inventory.map(renderInventory)]}
              />
            </Box>
            <Box className={cn(fieldClass, span2Class)}>
              <Label>Distributor *</Label>
              <ChevronSelect
                value={f.supplierId}
                onChange={setOnChange}
                options={[...suppliers.map(renderSupplier)]}
              />
            </Box>
            <Box className={fieldClass} data-field="amount">
              <Label>Purchase price ₹ (per pack) *</Label>
              <Input
                className=""
                type="number"
                step="0.01"
                value={f.purchasePrice || ""}
                onChange={setOnChange2}
              />
            </Box>
            <Box className={fieldClass}>
              <Label>MRP ₹ (per pack)</Label>
              <Input
                className=""
                type="number"
                step="0.01"
                value={f.mrp ?? ""}
                onChange={setOnChange3}
              />
            </Box>
            <Box className={fieldClass}>
              <Label>Bonus — buy</Label>
              <Input
                className=""
                type="number"
                value={f.bonusBuy ?? ""}
                onChange={setOnChange4}
                placeholder="e.g. 10"
              />
            </Box>
            <Box className={fieldClass}>
              <Label>… get free</Label>
              <Input
                className=""
                type="number"
                value={f.bonusFree ?? ""}
                onChange={setOnChange5}
                placeholder="e.g. 1"
              />
            </Box>
            <Box className={cn(fieldClass, span2Class)}>
              <Label>Note (credit / shipping)</Label>
              <Input
                className=""
                value={f.note || ""}
                onChange={setOnChange6}
                placeholder="e.g. free shipping above ₹5000"
              />
            </Box>
          </Box>
          {f.purchasePrice > 0 && schemeLabel(f as SupplyEntry) && (
            <Box className="!mt-2 !text-[12px] !font-bold !text-[#1f7a46]">
              Landed cost after {schemeLabel(f as SupplyEntry)} scheme:{" "}
              {inr2(effectiveSupplyPrice(f as SupplyEntry))} / pack
            </Box>
          )}

          {others.length > 0 && (
            <Box className="!mt-3.5 !rounded-md !border !border-line !bg-wash-2 !p-[18px] !shadow-sm">
              <Box className={cn("!text-[12px] !font-bold !text-ink-2 !mb-1.5")}>
                {prod?.name} is also supplied by:
              </Box>
              <Box className={cn("!flex !items-center !gap-2.5", "!flex-wrap !gap-1.5")}>
                {rankedOthers.map(renderO)}
              </Box>
              {landedGap !== null &&
                (landedGap >= 0 ? (
                  <Box className="!mt-2 !text-[12px] !font-bold !text-[#1f7a46]">
                    <IconCheck size={13} /> Lowest landed price — {inr2(landedGap)} cheaper than the
                    next.
                  </Box>
                ) : (
                  <Box className={cn("!mt-2 !text-[12px] !text-mid")}>
                    {inr2(-landedGap)} more than the cheapest current source (landed).
                  </Box>
                ))}
            </Box>
          )}

          <Box className={cn("!flex !items-center !gap-2.5", "!mt-4 !gap-2.5 !items-center")}>
            <Switch
              checked={!!f.preferred}
              label="Toggle preferred"
              onClick={setOnClick}
              className="!transition-[background-color] !duration-[160ms] after:!bg-white after:!shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:!transition-transform after:!duration-[160ms] after:!ease-[cubic-bezier(0.3,0.7,0.4,1)]"
            />
            <Text className={cn("!text-[13px] !font-semibold")} as="span">
              Mark as preferred source for this item
            </Text>
          </Box>
        </Box>
        <Box className={modalFootClass}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!f.productId || !f.supplierId || f.purchasePrice <= 0}
            onClick={onSaveOnClick}
          >
            {init ? "Save changes" : "Add supply item"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function onPickProductOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return onPickProduct(e.target.value);
  }
  function renderInventory(p: InvProduct) {
    return {
      value: String(p.id),
      label:
        String(p.name) + " \u2014 " + String(p.pack) + " " + String(isDevice(p) ? " (device)" : ""),
    };
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
    return (
      <Text
        key={o.id}
        className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-gray-pill !text-muted"
        as="span"
      >
        {suppliers.find(matchSupplier)?.name} · {inr2(effectiveSupplyPrice(o))}
        {schemeLabel(o) ? ` (${schemeLabel(o)})` : ""}
      </Text>
    );
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
