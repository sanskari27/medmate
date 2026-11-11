import type { ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { IconChart, IconGlobe, IconReceipt, IconStore, IconUsers } from "@/components/ui/Icon";
import { hasDocument } from "../draft";
import {
  BUSINESS_TYPES,
  INDUSTRIES,
  PHARMACY_TYPES,
  REGIONS,
  REGISTRATION_TYPES,
  choiceOptions,
  documentAccept,
} from "../options";
import type { DocumentSlot, DraftPatch, SetupDraft } from "../types";
import { FeatureRow, FileField, LogoPicker, SelectField } from "./fields";
import { IconBox, IconBulb, IconInventory, IconKiosk, IconRupee, IconSparkle } from "./icons";

type StepProps = {
  draft: SetupDraft;
  phone: string;
  onChange: (patch: DraftPatch) => void;
};

function onFile(onChange: StepProps["onChange"], slot: DocumentSlot, file: File) {
  onChange({ files: { [slot]: file } });
}

const WELCOME = [
  { key: "gst", title: "GST billing & invoices", icon: <IconReceipt size={18} /> },
  { key: "stock", title: "Inventory, batches & expiry", icon: <IconBox size={18} /> },
  { key: "online", title: "Online store & orders", icon: <IconGlobe size={18} /> },
  { key: "reports", title: "Reports, GST & CA sharing", icon: <IconChart size={18} /> },
] as const;

export function WelcomeStep() {
  return (
    <Box className="mx-auto grid w-full max-w-[520px] grid-cols-2 gap-2.5">
      {WELCOME.map((point) => (
        <Stack
          key={point.key}
          direction="row"
          align="center"
          className="gap-3 rounded-md border border-line px-3.5 py-3"
        >
          <Box className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-wash text-mid">
            {point.icon}
          </Box>
          <Text as="span" className="text-[13.5px] font-bold text-ink">
            {point.title}
          </Text>
        </Stack>
      ))}
    </Box>
  );
}

export function BusinessStep({ draft, phone, onChange }: StepProps) {
  function toggleType(type: string) {
    const businessTypes = draft.businessTypes.includes(type)
      ? draft.businessTypes.filter((item) => item !== type)
      : [...draft.businessTypes, type];
    onChange({ businessTypes });
  }
  return (
    <Stack className="gap-0">
      <Stack direction="row" align="start" gap={4} className="mb-4">
        <LogoPicker
          file={draft.files.logo}
          stored={Boolean(draft.stored.some((document) => document.slot === "logo"))}
          onFile={(file) => onFile(onChange, "logo", file)}
        />
        <Stack className="min-w-0 flex-1 gap-0">
          <Field label="Pharmacy name *">
            <Input
              value={draft.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="e.g. Sri Sai Medicals"
            />
          </Field>
          <Field className="mt-2.5" label="Tagline">
            <Input
              value={draft.tagline}
              onChange={(event) => onChange({ tagline: event.target.value })}
              placeholder="Your neighbourhood pharmacy"
            />
          </Field>
        </Stack>
      </Stack>
      <Field label="Business type (select all that apply)">
        <Stack direction="row" wrap className="mt-1.5 gap-1.5">
          {BUSINESS_TYPES.map((type) => {
            const selected = draft.businessTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleType(type)}
                className={
                  selected
                    ? "rounded-full border border-mid bg-wash px-3 py-1 text-[12.5px] font-bold text-mid"
                    : "rounded-full border border-line px-3 py-1 text-[12.5px] font-bold text-ink-2"
                }
              >
                {type}
              </button>
            );
          })}
        </Stack>
      </Field>
      <Box className="mt-[14px] grid grid-cols-2 gap-[14px] max-[540px]:grid-cols-1">
        <SelectField
          label="Pharmacy or hospital *"
          value={draft.pharmacyType}
          options={[{ value: "", label: "Select" }, ...PHARMACY_TYPES]}
          onChange={(value) =>
            onChange({ pharmacyType: value === "hospital" || value === "pharmacy" ? value : "" })
          }
        />
        <SelectField
          label="Registration type *"
          value={draft.registrationType}
          options={choiceOptions(REGISTRATION_TYPES)}
          onChange={(registrationType) => onChange({ registrationType })}
        />
        <SelectField
          label="Industry *"
          value={draft.industry}
          options={choiceOptions(INDUSTRIES)}
          onChange={(industry) => onChange({ industry })}
        />
        <Field label="Email *">
          <Input
            value={draft.email}
            onChange={(event) => onChange({ email: event.target.value })}
            placeholder="store@email.com"
          />
        </Field>
        <Field label="Phone *" className="col-span-full">
          <Input value={phone} readOnly aria-readonly="true" className="bg-wash-2" />
          <Text className="text-xs text-muted">
            Login uses this number, so it cannot be changed.
          </Text>
        </Field>
      </Box>
    </Stack>
  );
}

export function LocationStep({ draft, onChange }: StepProps) {
  return (
    <Box className="grid grid-cols-2 gap-[14px] max-[540px]:grid-cols-1">
      <Field label="Billing address *" className="col-span-full">
        <textarea
          value={draft.address}
          onChange={(event) => onChange({ address: event.target.value })}
          className="min-h-20 w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus"
        />
      </Field>
      <Field label="City *">
        <Input value={draft.city} onChange={(event) => onChange({ city: event.target.value })} />
      </Field>
      <Field label="Pincode *">
        <Input
          value={draft.pincode}
          onChange={(event) => onChange({ pincode: event.target.value })}
          inputMode="numeric"
        />
      </Field>
      <Box className="col-span-full">
        <SelectField
          label="State *"
          value={draft.state}
          options={choiceOptions(REGIONS)}
          onChange={(state) => onChange({ state })}
        />
      </Box>
    </Box>
  );
}

function upper(event: ChangeEvent<HTMLInputElement>) {
  return event.target.value.toUpperCase();
}

export function TaxStep({ draft, onChange }: StepProps) {
  function file(slot: DocumentSlot, picked: File) {
    onFile(onChange, slot, picked);
  }
  return (
    <Stack className="gap-0">
      <Box className="grid grid-cols-2 gap-[14px] max-[540px]:grid-cols-1 pb-4">
        <Field label="GSTIN *">
          <Input
            value={draft.gstin}
            onChange={(event) => onChange({ gstin: upper(event) })}
            className="font-mono"
          />
        </Field>
        <FileField
          label="GST certificate *"
          slot="gst"
          draft={draft}
          accept={documentAccept()}
          onFile={file}
        />
        <Field label="PAN number *">
          <Input
            value={draft.pan}
            onChange={(event) => onChange({ pan: upper(event) })}
            className="font-mono"
          />
        </Field>
        <FileField
          label="PAN card *"
          slot="pan"
          draft={draft}
          accept={documentAccept()}
          onFile={file}
        />
        <Field label="Drug Licence No. (D.L.) *">
          <Input
            value={draft.drugLicenceNo}
            onChange={(event) => onChange({ drugLicenceNo: event.target.value })}
            className="font-mono"
          />
        </Field>
        <FileField
          label="Drug licence *"
          slot="drug-licence"
          draft={draft}
          accept={documentAccept()}
          onFile={file}
        />
        <Field label="FSSAI Licence No. *">
          <Input
            value={draft.fssaiNo}
            onChange={(event) => onChange({ fssaiNo: event.target.value })}
            className="font-mono"
          />
        </Field>
        <FileField
          label="FSSAI licence *"
          slot="fssai"
          draft={draft}
          accept={documentAccept()}
          onFile={file}
        />
        <Field label="Trade Licence No. *">
          <Input
            value={draft.tradeLicenceNo}
            onChange={(event) => onChange({ tradeLicenceNo: event.target.value })}
            className="font-mono"
          />
        </Field>
        <FileField
          label="Trade licence *"
          slot="trade-licence"
          draft={draft}
          accept={documentAccept()}
          onFile={file}
        />
      </Box>
      <FeatureRow
        icon={<IconRupee size={18} />}
        title="Enable TDS"
        subtitle="Deduct TDS on applicable purchases"
        checked={draft.enableTds}
        onToggle={() => onChange({ enableTds: !draft.enableTds })}
      />
      <FeatureRow
        icon={<IconRupee size={18} />}
        title="Enable TCS"
        subtitle="Collect TCS on applicable sales"
        checked={draft.enableTcs}
        onToggle={() => onChange({ enableTcs: !draft.enableTcs })}
      />
    </Stack>
  );
}

export function PharmacistStep({ draft, onChange }: StepProps) {
  return (
    <Stack className="gap-[14px]">
      <Field label="Registered pharmacist *">
        <Input
          value={draft.pharmacistName}
          onChange={(event) => onChange({ pharmacistName: event.target.value })}
          placeholder="Name, B.Pharm (Reg. No.)"
        />
      </Field>
      <FileField
        label="Pharmacist certificate *"
        slot="pharmacist-certificate"
        draft={draft}
        accept={documentAccept()}
        onFile={(slot, file) => onFile(onChange, slot, file)}
      />
      <Text className="text-[12.5px] text-muted">
        <IconBulb size={14} /> You can add cashiers, managers & more pharmacists later under{" "}
        <Text as="span" className="font-bold">
          Manage Users
        </Text>{" "}
        — each with their own role, PIN & permissions.
      </Text>
    </Stack>
  );
}

export function InvoiceStep({ draft, onChange }: StepProps) {
  return (
    <Box className="grid grid-cols-2 gap-[14px] max-[540px]:grid-cols-1">
      <Field label="Invoice number prefix *">
        <Input
          value={draft.invoicePrefix}
          onChange={(event) => onChange({ invoicePrefix: event.target.value })}
          className="font-mono"
        />
      </Field>
      <FileField
        label="Signature / stamp *"
        slot="signature"
        draft={draft}
        accept={documentAccept(true)}
        onFile={(slot, file) => onFile(onChange, slot, file)}
      />
      <Field label="Terms & conditions (shown on invoices)" className="col-span-full">
        <textarea
          value={draft.terms}
          onChange={(event) => onChange({ terms: event.target.value })}
          className="min-h-20 w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus"
        />
      </Field>
    </Box>
  );
}

export function FeaturesStep({ draft, onChange }: StepProps) {
  return (
    <Stack className="gap-0">
      <FeatureRow
        icon={<IconStore size={18} />}
        title="Accept online orders"
        subtitle="List your store on the Namma MedMate customer app"
        checked={draft.acceptOnlineOrders}
        onToggle={() => onChange({ acceptOnlineOrders: !draft.acceptOnlineOrders })}
      />
      <FeatureRow
        icon={<IconKiosk size={18} />}
        title="Self-order kiosk"
        subtitle="In-store screen for customers to order themselves"
        checked={draft.selfOrderKiosk}
        onToggle={() => onChange({ selfOrderKiosk: !draft.selfOrderKiosk })}
      />
      <FeatureRow
        icon={<IconReceipt size={18} />}
        title="e-Invoicing"
        subtitle="Generate IRN/e-invoices for B2B sales"
        checked={draft.eInvoicing}
        onToggle={() => onChange({ eInvoicing: !draft.eInvoicing })}
      />
      <FeatureRow
        icon={<IconInventory size={18} />}
        title="Loose / per-tablet selling"
        subtitle="Allow selling individual tablets by default (per-strip eligible items)"
        checked={draft.looseSelling}
        onToggle={() => onChange({ looseSelling: !draft.looseSelling })}
      />
      <FeatureRow
        icon={<IconUsers size={18} />}
        title="Low-stock & expiry alerts"
        subtitle="Always on — dashboard flags items to reorder or that are expiring"
        locked
      />
    </Stack>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      justify="between"
      className="border-b border-line py-[7px] text-[12.5px]"
    >
      <Text as="span" className="text-[12.5px] text-muted">
        {label}
      </Text>
      <Text as="span" className="text-right text-[12.5px] font-bold text-ink">
        {value}
      </Text>
    </Stack>
  );
}

function attached(draft: SetupDraft, slot: DocumentSlot, value: string) {
  return hasDocument(draft, slot) ? `${value} · attached` : value || "—";
}

export function ReviewStep({ draft }: StepProps) {
  const type = draft.pharmacyType === "hospital" ? "Hospital" : "Pharmacy";
  return (
    <Stack gap={4}>
      <Stack direction="row" align="center" gap={3}>
        <Box className="grid h-[52px] w-[52px] place-items-center overflow-hidden rounded-[13px] bg-wash">
          <IconStore size={24} />
        </Box>
        <Stack gap={0}>
          <Heading level={3} className="text-[18px]">
            {draft.name || "Your pharmacy"}
          </Heading>
          <Text as="span" className="text-[12.5px] text-muted">
            {type}
            {draft.businessTypes.length > 0 ? ` · ${draft.businessTypes.join(", ")}` : ""} ·{" "}
            {draft.city}, {draft.state}
          </Text>
        </Stack>
      </Stack>
      <Box className="grid grid-cols-2 gap-x-[18px] gap-y-1">
        <ReviewLine label="Pharmacy type" value={type} />
        <ReviewLine label="GSTIN" value={attached(draft, "gst", draft.gstin)} />
        <ReviewLine label="PAN" value={attached(draft, "pan", draft.pan)} />
        <ReviewLine
          label="Drug Licence"
          value={attached(draft, "drug-licence", draft.drugLicenceNo)}
        />
        <ReviewLine label="FSSAI" value={attached(draft, "fssai", draft.fssaiNo)} />
        <ReviewLine
          label="Trade Licence"
          value={attached(draft, "trade-licence", draft.tradeLicenceNo)}
        />
        <ReviewLine label="Invoice prefix" value={draft.invoicePrefix} />
        <ReviewLine label="Pharmacist" value={draft.pharmacistName.split(",")[0] || "—"} />
        <ReviewLine
          label="Pharmacist certificate"
          value={hasDocument(draft, "pharmacist-certificate") ? "Attached" : "—"}
        />
        <ReviewLine label="Signature" value={hasDocument(draft, "signature") ? "Attached" : "—"} />
        <ReviewLine label="Online orders" value={draft.acceptOnlineOrders ? "On" : "Off"} />
        <ReviewLine label="Kiosk" value={draft.selfOrderKiosk ? "On" : "Off"} />
        <ReviewLine label="Loose selling" value={draft.looseSelling ? "On" : "Off"} />
      </Box>
      <Box className="rounded-md border border-line bg-wash-2 p-2 text-center shadow-sm">
        <Text as="span" className="text-[13px] text-ink">
          <IconSparkle size={13} /> You’re all set. Finish setup sends this application for review.
        </Text>
      </Box>
    </Stack>
  );
}
