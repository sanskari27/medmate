import { useRef, useState, type ChangeEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Image } from "@/components/atoms/Image";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Stack } from "@/components/atoms/Stack";
import { Switch } from "@/components/atoms/Switch";
import { Text } from "@/components/atoms/Text";
import { IconUpload } from "@/components/atoms/Icon";
import { Field } from "@/components/molecules/Field";
import { Modal } from "@/components/molecules/Modal";
import { monogramOf } from "@/components/molecules/EntityMark";
import { CATEGORIES, SCHEDULE_META, type DosageForm, type InvProduct, type Schedule } from "@/utils";
import { productDraftReady } from "../../Inventory.utils";
import type { ProductModalProps } from "./ProductModal.types";

const FORMS: DosageForm[] = ["Tablet", "Capsule", "Syrup", "Drops", "Injection", "Cream", "Device", "Other"];
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
    return { value: String(schedule), label: String(SCHEDULE_META[schedule].label) + " \u2014 " + String(SCHEDULE_META[schedule].rx ? "Rx" : "OTC") };
  }
  function renderGst(rate: number) {
    return { value: String(rate), label: String(rate) + "%" };
  }
  const looseEligible = draft.form === "Tablet" || draft.form === "Capsule";

  return (
    <Modal
      title={`Edit ${draft.name}`}
      size="lg"
      className="max-w-[720px]"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!ready} onClick={save}>
            Save changes
          </Button>
        </>
      }
    >
      <Box className="grid grid-cols-2 gap-3.5">
        <Field label="Medicine name" className="col-span-2">
          <Input value={draft.name} onChange={changeName} placeholder="e.g. Dolo 650" />
        </Field>
        <Field label="Composition / salt" className="col-span-2">
          <Input value={draft.composition} onChange={changeComposition} placeholder="e.g. Paracetamol 650mg" />
        </Field>
        <Field label="Manufacturer">
          <Input value={draft.manufacturer} onChange={changeManufacturer} />
        </Field>
        <Field label="Pack">
          <Input value={draft.pack} onChange={changePack} placeholder="Strip of 15" />
        </Field>
        <Field label="Category">
          <Select value={draft.category} onChange={changeCategory} options={[...(CATEGORIES.map(renderCategory))]} />
        </Field>
        <Field label="Form">
          <Select value={draft.form} onChange={changeForm} options={[...(FORMS.map(renderForm))]} />
        </Field>
        <Field label="Drug schedule">
          <Select value={draft.schedule} onChange={changeSchedule} options={[...(SCHEDS.map(renderSchedule))]} />
        </Field>
        <Field label="HSN code">
          <Input value={draft.hsn} onChange={changeHsn} />
        </Field>
        <Field label="GST %">
          <Select value={draft.gst} onChange={changeGst} options={[...(GSTS.map(renderGst))]} />
        </Field>
        <Field label="Rack location · Rack-Shelf-Bin">
          <Input className="font-mono" value={draft.rack} onChange={changeRack} placeholder="A3-12" />
        </Field>
        <Field label="2nd slot · overflow (optional)">
          <Input className="font-mono" value={draft.rackAlt ?? ""} onChange={changeRackAlt} placeholder="—" />
        </Field>
        <Field label="Reorder level (units)">
          <Input type="number" value={draft.reorderLevel} onChange={changeReorder} />
        </Field>
        <Field label="Product photo" className="col-span-2">
          <Stack direction="row" align="center" gap={3}>
            <Box className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-wash text-[30px]">
              {draft.image ? (
                <Image src={draft.image} alt="" fit="cover" className="h-16 w-16" />
              ) : (
                monogramOf(draft.name)
              )}
            </Box>
            <Input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            <Stack direction="row" gap={1}>
              <Button variant="ghost" size="sm" onClick={openPhoto}>
                <IconUpload size={14} /> {draft.image ? "Change photo" : "Upload photo"}
              </Button>
              {draft.image ? (
                <Button variant="link" className="text-rose" onClick={removePhoto}>
                  Remove
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Field>
      </Box>
      {looseEligible ? (
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="mt-2 cursor-pointer border-y border-line py-3"
        >
          <Box>
            <Text as="span" className="text-[13.5px] font-bold">
              Allow loose / per-tablet selling
            </Text>
            <Text variant="caption" className="text-[12px]">
              Let staff sell individual {draft.form.toLowerCase()}s at the counter (auto-priced per unit)
            </Text>
          </Box>
          <Switch checked={draft.looseAllowed ?? true} label="Allow loose selling" onClick={toggleLoose} />
        </Stack>
      ) : null}
    </Modal>
  );
}
