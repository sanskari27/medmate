import { useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { Image } from "@/components/atoms/Image";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Stack } from "@/components/atoms/Stack";
import { Switch } from "@/components/atoms/Switch";
import { Text } from "@/components/atoms/Text";
import { IconUpload, IconX } from "@/components/atoms/Icon";
import { Field } from "@/components/molecules/Field";
import { monogramOf } from "@/components/molecules/EntityMark";
import {
  CATEGORIES,
  SCHEDULE_META,
  type DosageForm,
  type InvProduct,
  type Schedule,
} from "@/utils";
import { productDraftReady } from "../../Inventory.utils";
import type { ProductModalProps } from "./ProductModal.types";

const modalMotion = `
@keyframes inventoryFade { from { opacity: 0 } }
@keyframes inventoryPop { from { transform: translateY(14px) scale(.98); opacity: .6 } }
.inventory-fade { animation: inventoryFade .16s ease }
.inventory-pop { animation: inventoryPop .2s cubic-bezier(.2,.9,.3,1.2) }
.inventory-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232F7D52' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 11px center;
  padding-right: 34px;
}
.inventory-select:hover {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%231B3D29' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
}
`;

const FORMS: DosageForm[] = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Drops",
  "Injection",
  "Cream",
  "Device",
  "Other",
];
const SCHEDS: Schedule[] = ["OTC", "H", "H1", "X"];
const GSTS = [0, 5, 12, 18];

export function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const [draft, setDraft] = useState<InvProduct>(product);
  const photoRef = useRef<HTMLInputElement>(null);
  const ready = productDraftReady(draft.name);

  function patch(next: Partial<InvProduct>) {
    setDraft(function merge(current) {
      return { ...current, ...next };
    });
  }
  function changeName(event: ChangeEvent<HTMLInputElement>) {
    patch({ name: event.target.value });
  }
  function changeComposition(event: ChangeEvent<HTMLInputElement>) {
    patch({ composition: event.target.value });
  }
  function changeManufacturer(event: ChangeEvent<HTMLInputElement>) {
    patch({ manufacturer: event.target.value });
  }
  function changePack(event: ChangeEvent<HTMLInputElement>) {
    patch({ pack: event.target.value });
  }
  function changeCategory(event: ChangeEvent<HTMLSelectElement>) {
    patch({ category: event.target.value });
  }
  function changeForm(event: ChangeEvent<HTMLSelectElement>) {
    patch({ form: event.target.value as DosageForm });
  }
  function changeSchedule(event: ChangeEvent<HTMLSelectElement>) {
    patch({ schedule: event.target.value as Schedule });
  }
  function changeHsn(event: ChangeEvent<HTMLInputElement>) {
    patch({ hsn: event.target.value });
  }
  function changeGst(event: ChangeEvent<HTMLSelectElement>) {
    patch({ gst: Number(event.target.value) });
  }
  function changeRack(event: ChangeEvent<HTMLInputElement>) {
    patch({ rack: event.target.value.toUpperCase() });
  }
  function changeRackAlt(event: ChangeEvent<HTMLInputElement>) {
    patch({ rackAlt: event.target.value.toUpperCase() || undefined });
  }
  function changeReorder(event: ChangeEvent<HTMLInputElement>) {
    patch({ reorderLevel: Number(event.target.value) || 0 });
  }
  function openPhoto() {
    photoRef.current?.click();
  }
  function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function loaded() {
      patch({ image: reader.result as string });
    };
    reader.readAsDataURL(file);
  }
  function removePhoto() {
    patch({ image: undefined });
  }
  function toggleLoose() {
    patch({ looseAllowed: !(draft.looseAllowed ?? true) });
  }
  function toggleLooseFromSwitch(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    toggleLoose();
  }
  function keepOpen(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }
  function save() {
    onSave(draft);
  }
  function renderCategory(category: { key: string; label: string }) {
    return { value: String(category.key), label: String(category.label) };
  }
  function renderForm(form: DosageForm) {
    return { value: String(form), label: String(form) };
  }
  function renderSchedule(schedule: Schedule) {
    return {
      value: String(schedule),
      label:
        String(SCHEDULE_META[schedule].label) +
        " \u2014 " +
        String(SCHEDULE_META[schedule].rx ? "Rx" : "OTC"),
    };
  }
  function renderGst(rate: number) {
    return { value: String(rate), label: String(rate) + "%" };
  }
  const looseEligible = draft.form === "Tablet" || draft.form === "Capsule";

  return (
    <Box
      className="inventory-fade fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px] max-[767px]:items-end max-[767px]:p-0"
      onClick={onClose}
    >
      <style>{modalMotion}</style>
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${draft.name}`}
        className="inventory-pop flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop max-[767px]:max-h-[92dvh] max-[767px]:max-w-none max-[767px]:rounded-t-2xl max-[767px]:rounded-b-none"
        onClick={keepOpen}
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="border-b border-line px-5 py-4"
        >
          <Heading level={3} className="text-[17px]">
            Edit {draft.name}
          </Heading>
          <IconButton
            label="Close"
            className="h-8 w-8 rounded-sm border-0 bg-wash-2 text-ink-2 hover:bg-wash hover:text-ink-2"
            onClick={onClose}
          >
            <IconX size={18} />
          </IconButton>
        </Stack>
        <Box className="overflow-y-auto px-5 py-5">
          <Box className="grid grid-cols-2 gap-3.5 max-[767px]:grid-cols-1">
            <Field label="Medicine name" className="col-span-2 max-[767px]:col-span-1">
              <Input value={draft.name} onChange={changeName} placeholder="e.g. Dolo 650" />
            </Field>
            <Field label="Composition / salt" className="col-span-2 max-[767px]:col-span-1">
              <Input
                value={draft.composition}
                onChange={changeComposition}
                placeholder="e.g. Paracetamol 650mg"
              />
            </Field>
            <Field label="Manufacturer">
              <Input value={draft.manufacturer} onChange={changeManufacturer} />
            </Field>
            <Field label="Pack">
              <Input value={draft.pack} onChange={changePack} placeholder="Strip of 15" />
            </Field>
            <Field label="Category">
              <Select
                className="inventory-select"
                value={draft.category}
                onChange={changeCategory}
                options={[...CATEGORIES.map(renderCategory)]}
              />
            </Field>
            <Field label="Form">
              <Select
                className="inventory-select"
                value={draft.form}
                onChange={changeForm}
                options={[...FORMS.map(renderForm)]}
              />
            </Field>
            <Field label="Drug schedule">
              <Select
                className="inventory-select"
                value={draft.schedule}
                onChange={changeSchedule}
                options={[...SCHEDS.map(renderSchedule)]}
              />
            </Field>
            <Field label="HSN code">
              <Input value={draft.hsn} onChange={changeHsn} />
            </Field>
            <Field label="GST %">
              <Select
                className="inventory-select"
                value={draft.gst}
                onChange={changeGst}
                options={[...GSTS.map(renderGst)]}
              />
            </Field>
            <Field
              label={
                <>
                  Rack location <span className="font-normal text-muted">· Rack-Shelf-Bin</span>
                </>
              }
            >
              <Input
                className="font-mono"
                value={draft.rack}
                onChange={changeRack}
                placeholder="A3-12"
              />
            </Field>
            <Field
              label={
                <>
                  2nd slot <span className="font-normal text-muted">· overflow (optional)</span>
                </>
              }
            >
              <Input
                className="font-mono"
                value={draft.rackAlt ?? ""}
                onChange={changeRackAlt}
                placeholder="—"
              />
            </Field>
            <Field label="Reorder level (units)">
              <Input type="number" value={draft.reorderLevel} onChange={changeReorder} />
            </Field>
          </Box>
          <Field label="Product photo" className="mt-[14px]">
            <Stack direction="row" align="center" className="gap-[14px]">
              <Box className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-wash font-display text-[30px] leading-none font-[750] tracking-[-0.02em] text-mid">
                {draft.image ? (
                  <Image src={draft.image} alt="" fit="cover" className="h-16 w-16" />
                ) : (
                  monogramOf(draft.name)
                )}
              </Box>
              <Input
                ref={photoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPhoto}
              />
              <Stack direction="row" className="gap-[6px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="active:translate-y-px"
                  onClick={openPhoto}
                >
                  <IconUpload size={14} /> {draft.image ? "Change photo" : "Upload photo"}
                </Button>
                {draft.image ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border-transparent bg-transparent text-rose shadow-none hover:border-transparent hover:bg-transparent hover:text-rose active:translate-y-px"
                    onClick={removePhoto}
                  >
                    Remove
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Field>
          {looseEligible ? (
            <Stack
              direction="row"
              align="center"
              justify="between"
              className="mt-2 cursor-pointer border-y border-line py-3"
              onClick={toggleLoose}
            >
              <Box>
                <Text as="span" className="text-[13.5px] font-bold">
                  Allow loose / per-tablet selling
                </Text>
                <Text variant="caption" className="text-[12px]">
                  Let staff sell individual {draft.form.toLowerCase()}s at the counter (auto-priced
                  per unit)
                </Text>
              </Box>
              <Switch
                checked={draft.looseAllowed ?? true}
                label="Allow loose selling"
                onClick={toggleLooseFromSwitch}
              />
            </Stack>
          ) : null}
        </Box>
        <Stack
          direction="row"
          justify="end"
          className="gap-[10px] border-t border-line px-5 py-3.5 max-[767px]:flex-wrap max-[767px]:[&_button]:flex-1"
        >
          <Button variant="ghost" className="active:translate-y-px" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="active:translate-y-px"
            disabled={!ready}
            onClick={save}
          >
            Save changes
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
