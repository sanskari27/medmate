import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Alert } from "@/components/molecules/Alert";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { Image } from "@/components/atoms/Image";
import { Input } from "@/components/atoms/Input";
import { Pill } from "@/components/atoms/Pill";
import { Select } from "@/components/atoms/Select";
import { Stack } from "@/components/atoms/Stack";
import { Switch } from "@/components/atoms/Switch";
import { Text } from "@/components/atoms/Text";
import { Textarea } from "@/components/atoms/Textarea";
import { Grid } from "@/components/atoms/Grid";
import {
  IconArrowRight,
  IconBox,
  IconBulb,
  IconChart,
  IconCheck,
  IconFolder,
  IconGlobe,
  IconInventory,
  IconKiosk,
  IconReceipt,
  IconRupee,
  IconSparkle,
  IconStore,
  IconUpload,
  IconUsers,
} from "@/components/atoms/Icon";
import { Chip } from "@/components/molecules/Chip";
import { Field } from "@/components/molecules/Field";
import { ListRow } from "@/components/molecules/ListRow";
import { usePharma } from "@/hooks";
import {
  INDUSTRY_TYPES,
  INDIAN_STATES,
  PHARMACY_BUSINESS_TYPES,
  REGISTRATION_TYPES,
  setupGap,
  type PharmacyProfile,
  type ProfileFile,
} from "@/utils";
import { cn } from "@/utils/className";
import type { SetupWizardProps } from "./SetupWizard.types";

const STEPS = [
  { title: "Welcome", subtitle: "Let's set up your pharmacy" },
  { title: "Business profile", subtitle: "Tell us about your pharmacy" },
  { title: "Location", subtitle: "Where is your store?" },
  { title: "Tax & licences", subtitle: "GST, PAN, drug & trade licences" },
  { title: "Pharmacist", subtitle: "Registered pharmacist on record" },
  { title: "Invoice & branding", subtitle: "How your bills look" },
  { title: "Features", subtitle: "Turn on what you need" },
  { title: "Catalogue", subtitle: "Start your medicine list" },
  { title: "Review", subtitle: "Confirm & finish" },
];

type Draft = PharmacyProfile & {
  invoicePrefix: string;
  terms: string;
  kioskEnabled: boolean;
  looseDefault: boolean;
};

const WELCOME_POINTS = [
  { key: "gst", title: "GST billing & invoices" },
  { key: "stock", title: "Inventory, batches & expiry" },
  { key: "online", title: "Online store & orders" },
  { key: "reports", title: "Reports, GST & CA sharing" },
] as const;

function WelcomeIcon({ id }: { id: (typeof WELCOME_POINTS)[number]["key"] }) {
  if (id === "gst") return <IconReceipt size={18} />;
  if (id === "stock") return <IconBox size={18} />;
  if (id === "online") return <IconGlobe size={18} />;
  return <IconChart size={18} />;
}

function WelcomePoint({ id, title }: { id: (typeof WELCOME_POINTS)[number]["key"]; title: string }) {
  return (
    <Stack direction="row" align="center" className="gap-3 rounded-md border border-line px-3.5 py-3">
      <Box className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-wash text-mid">
        <WelcomeIcon id={id} />
      </Box>
      <Text as="span" className="text-[13.5px] font-bold text-ink">
        {title}
      </Text>
    </Stack>
  );
}

function WelcomePoints() {
  function renderPoint(point: (typeof WELCOME_POINTS)[number]) {
    return <WelcomePoint key={point.key} id={point.key} title={point.title} />;
  }
  return WELCOME_POINTS.map(renderPoint);
}

function StepDot({ state }: { state: "done" | "current" | "todo" }) {
  return (
    <Box
      className={cn(
        "h-[5px] flex-1 rounded-[3px] bg-line",
        state === "done" && "bg-light",
        state === "current" && "bg-mid",
      )}
    />
  );
}

function StepDots({ step }: { step: number }) {
  const indexes = Array.from({ length: STEPS.length }, function indexAt(_item, index) {
    return index;
  });
  function renderDot(index: number) {
        const state = index === step ? "current" : index < step ? "done" : "todo";
        return <StepDot key={index} state={state} />;
      }
  return (
    <Stack direction="row" className="mt-[13px] gap-[5px]">
      {indexes.map(renderDot)}
    </Stack>
  );
}

function SelectValues({ values }: { values: readonly string[] }) {
  function renderValue(value: string) {
    return { value: String(value), label: String(value) };
  }
  return values.map(renderValue);
}

function BusinessTypeChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: (label: string) => void;
}) {
  function onChipClick() {
    onToggle(label);
  }
  return (
    <Chip selected={selected} onClick={onChipClick}>
      {label}
    </Chip>
  );
}

function BusinessTypes({ selected, onToggle }: { selected: string[]; onToggle: (label: string) => void }) {
  function renderType(type: string) {
        return <BusinessTypeChip key={type} label={type} selected={selected.includes(type)} onToggle={onToggle} />;
      }
  return (
    <Stack direction="row" wrap className="gap-1.5">
      {PHARMACY_BUSINESS_TYPES.map(renderType)}
    </Stack>
  );
}

function readImage(file: File, apply: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = function onLoad() {
    apply(String(reader.result || ""));
  };
  reader.readAsDataURL(file);
}

function LogoPicker({ logo, onLogo }: { logo?: string; onLogo: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  function openPicker() {
    inputRef.current?.click();
  }
  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    readImage(file, onLogo);
  }
  return (
    <Box>
      <Input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={onFile} />
      <Button
        variant="ghost"
        className={cn(
          "h-[84px] w-[84px] overflow-hidden rounded-lg border border-dashed border-line-2 p-0",
          logo ? "bg-dark" : "bg-wash-2",
        )}
        onClick={openPicker}
      >
        {logo ? (
          <Image src={logo} alt="" fit="contain" className="h-full w-full" />
        ) : (
          <Stack align="center" gap={1} className="text-muted">
            <IconUpload size={18} />
            <Text as="span" variant="caption">
              Logo
            </Text>
          </Stack>
        )}
      </Button>
    </Box>
  );
}

function WizardLicence({
  label,
  value,
  file,
  field,
  onValue,
  onFile,
}: {
  label: string;
  value: string;
  file?: ProfileFile;
  field?: string;
  onValue: (value: string) => void;
  onFile: (file: ProfileFile) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  function onText(event: ChangeEvent<HTMLInputElement>) {
    onValue(event.target.value.toUpperCase());
  }
  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (!picked) return;
    const reader = new FileReader();
    reader.onload = function onLoad() {
      onFile({ name: picked.name, dataUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(picked);
    event.target.value = "";
  }
  function openPicker() {
    inputRef.current?.click();
  }
  return (
    <>
      <Field label={`${label} *`} data-field={field}>
        <Input value={value} onChange={onText} className="font-mono" />
      </Field>
      <Field label={`${label} document *`}>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="sr-only"
          onChange={onPick}
        />
        {file?.dataUrl ? (
          <Stack direction="row" align="center" gap={2}>
            <Text as="span" className="text-[12.5px] font-bold">
              {file.name}
            </Text>
            <Button variant="ghost" size="sm" onClick={openPicker}>
              Replace
            </Button>
          </Stack>
        ) : (
          <Button variant="ghost" size="sm" onClick={openPicker}>
            <IconUpload size={14} /> Attach
          </Button>
        )}
      </Field>
    </>
  );
}

function WizardFeat({
  icon,
  title,
  subtitle,
  checked,
  onToggle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      leading={<Box className="grid h-9 w-9 place-items-center rounded-sm bg-wash text-mid">{icon}</Box>}
      trailing={<Switch checked={checked} label={title} onClick={onToggle} />}
    />
  );
}

function WelcomeStep() {
  return (
    <Stack align="center" className="py-3.5 text-center">
      <Box className="inline-grid text-mid">
        <IconStore size={28} />
      </Box>
      <Heading level={2} className="mt-2 text-[23px]">
        Welcome to your pharmacy console
      </Heading>
      <Text className="mx-auto mt-2 max-w-[460px] text-[14px] text-muted">
        A quick setup gets your store ready for GST billing, inventory, online orders & more. It takes about 2
        minutes — you can change everything later in Settings.
      </Text>
      <Grid columns={2} className="mx-auto mt-5 w-full max-w-[520px] gap-2.5 text-left">
        <WelcomePoints />
      </Grid>
    </Stack>
  );
}

function BusinessStep({ draft, update }: { draft: Draft; update: (patch: Partial<Draft>) => void }) {
  function onLogo(logo: string) {
    update({ logo });
  }
  function onName(event: ChangeEvent<HTMLInputElement>) {
    update({ name: event.target.value });
  }
  function onTagline(event: ChangeEvent<HTMLInputElement>) {
    update({ tagline: event.target.value });
  }
  function onToggleType(type: string) {
    update({
      businessTypes: draft.businessTypes.includes(type)
        ? draft.businessTypes.filter(function drop(item) {
            return item !== type;
          })
        : [...draft.businessTypes, type],
    });
  }
  function onRegistration(event: ChangeEvent<HTMLSelectElement>) {
    update({ registrationType: event.target.value });
  }
  function onIndustry(event: ChangeEvent<HTMLSelectElement>) {
    update({ industryType: event.target.value });
  }
  function onEmail(event: ChangeEvent<HTMLInputElement>) {
    update({ email: event.target.value });
  }
  return (
    <Stack gap={4}>
      <Stack direction="row" align="start" gap={4}>
        <LogoPicker logo={draft.logo} onLogo={onLogo} />
        <Stack gap={3} className="min-w-0 flex-1">
          <Field label="Pharmacy name *" data-field="name">
            <Input autoFocus value={draft.name} onChange={onName} placeholder="e.g. Sri Sai Medicals" />
          </Field>
          <Field label="Tagline">
            <Input value={draft.tagline} onChange={onTagline} placeholder="Your neighbourhood pharmacy" />
          </Field>
        </Stack>
      </Stack>
      <Field label="Business type (select all that apply)">
        <BusinessTypes selected={draft.businessTypes} onToggle={onToggleType} />
      </Field>
      <Grid columns={2} gap={3}>
        <Field label="Registration type *">
          <Select value={draft.registrationType} onChange={onRegistration} options={[...SelectValues({values: REGISTRATION_TYPES})]} />
        </Field>
        <Field label="Industry *">
          <Select value={draft.industryType} onChange={onIndustry} options={[...SelectValues({values: INDUSTRY_TYPES})]} />
        </Field>
        <Field label="Phone *" hint="Login uses this number, so it cannot be changed." data-field="phone">
          <Input value={draft.phone} readOnly aria-readonly="true" className="bg-wash" />
        </Field>
        <Field label="Email *" data-field="email">
          <Input value={draft.email} onChange={onEmail} placeholder="store@email.com" />
        </Field>
      </Grid>
    </Stack>
  );
}

function LocationStep({ draft, update }: { draft: Draft; update: (patch: Partial<Draft>) => void }) {
  function onAddress(event: ChangeEvent<HTMLTextAreaElement>) {
    update({ address: event.target.value });
  }
  function onCity(event: ChangeEvent<HTMLInputElement>) {
    update({ city: event.target.value });
  }
  function onPincode(event: ChangeEvent<HTMLInputElement>) {
    update({ pincode: event.target.value });
  }
  function onState(event: ChangeEvent<HTMLSelectElement>) {
    update({ state: event.target.value });
  }
  return (
    <Grid columns={2} gap={3}>
      <Field label="Billing address *" className="col-span-full">
        <Textarea value={draft.address} onChange={onAddress} />
      </Field>
      <Field label="City *">
        <Input value={draft.city} onChange={onCity} />
      </Field>
      <Field label="Pincode *">
        <Input value={draft.pincode} onChange={onPincode} />
      </Field>
      <Field label="State *" className="col-span-full">
        <Select value={draft.state} onChange={onState} options={[{ value: "", label: "Select state" }, ...SelectValues({values: INDIAN_STATES})]} />
      </Field>
    </Grid>
  );
}

function TaxStep({ draft, update }: { draft: Draft; update: (patch: Partial<Draft>) => void }) {
  function onGstin(gstin: string) {
    update({ gstin, gstRegistered: true });
  }
  function onGstFile(gstFile: ProfileFile) {
    update({ gstFile });
  }
  function onPan(pan: string) {
    update({ pan });
  }
  function onPanFile(panFile: ProfileFile) {
    update({ panFile });
  }
  function onDl(dlNo: string) {
    update({ dlNo });
  }
  function onDlFile(dlFile: ProfileFile) {
    update({ dlFile });
  }
  function onFssai(fssai: string) {
    update({ fssai });
  }
  function onFssaiFile(fssaiFile: ProfileFile) {
    update({ fssaiFile });
  }
  function onTrade(tradeNo: string) {
    update({ tradeNo });
  }
  function onTradeFile(tradeFile: ProfileFile) {
    update({ tradeFile });
  }
  function toggleTds() {
    update({ enableTDS: !draft.enableTDS });
  }
  function toggleTcs() {
    update({ enableTCS: !draft.enableTCS });
  }
  return (
    <Stack gap={2}>
      <Grid columns={2} gap={3}>
        <WizardLicence label="GSTIN" value={draft.gstin} file={draft.gstFile} field="gstin" onValue={onGstin} onFile={onGstFile} />
        <WizardLicence label="PAN number" value={draft.pan} file={draft.panFile} onValue={onPan} onFile={onPanFile} />
        <WizardLicence label="Drug Licence No. (D.L.)" value={draft.dlNo} file={draft.dlFile} onValue={onDl} onFile={onDlFile} />
        <WizardLicence label="FSSAI Licence No." value={draft.fssai} file={draft.fssaiFile} onValue={onFssai} onFile={onFssaiFile} />
        <WizardLicence label="Trade Licence No." value={draft.tradeNo || ""} file={draft.tradeFile} onValue={onTrade} onFile={onTradeFile} />
      </Grid>
      <WizardFeat icon={<IconRupee size={18} />} title="Enable TDS" subtitle="Deduct TDS on applicable purchases" checked={draft.enableTDS} onToggle={toggleTds} />
      <WizardFeat icon={<IconRupee size={18} />} title="Enable TCS" subtitle="Collect TCS on applicable sales" checked={draft.enableTCS} onToggle={toggleTcs} />
    </Stack>
  );
}

function PharmacistStep({ draft, update }: { draft: Draft; update: (patch: Partial<Draft>) => void }) {
  function onPharmacist(event: ChangeEvent<HTMLInputElement>) {
    update({ pharmacist: event.target.value });
  }
  return (
    <Stack gap={3}>
      <Field label="Registered pharmacist *" className="col-span-full">
        <Input value={draft.pharmacist} onChange={onPharmacist} placeholder="Name, B.Pharm (Reg. No.)" />
      </Field>
      <Text variant="muted">
        <IconBulb size={14} /> You can add cashiers, managers & more pharmacists later under{" "}
        <Text as="span" className="font-bold">
          Manage Users
        </Text>{" "}
        — each with their own role, PIN & permissions.
      </Text>
    </Stack>
  );
}

function InvoiceStep({ draft, update }: { draft: Draft; update: (patch: Partial<Draft>) => void }) {
  const signRef = useRef<HTMLInputElement>(null);
  function onPrefix(event: ChangeEvent<HTMLInputElement>) {
    update({ invoicePrefix: event.target.value });
  }
  function onTerms(event: ChangeEvent<HTMLTextAreaElement>) {
    update({ terms: event.target.value });
  }
  function openSign() {
    signRef.current?.click();
  }
  function onSign(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    readImage(file, function apply(signature) {
      update({ signature });
    });
  }
  return (
    <Grid columns={2} gap={3}>
      <Field label="Invoice number prefix *">
        <Input value={draft.invoicePrefix} onChange={onPrefix} className="font-mono" />
      </Field>
      <Field label="Signature / stamp *">
        <Input ref={signRef} type="file" accept="image/*" className="sr-only" onChange={onSign} />
        {draft.signature ? (
          <Stack direction="row" align="center" gap={2}>
            <Image src={draft.signature} alt="" className="h-10 rounded-sm border border-line p-0.5" />
            <Button variant="ghost" size="sm" onClick={openSign}>
              Replace
            </Button>
          </Stack>
        ) : (
          <Button variant="ghost" size="sm" onClick={openSign}>
            <IconUpload size={14} /> Upload
          </Button>
        )}
      </Field>
      <Field label="Terms & conditions (shown on invoices)" className="col-span-full">
        <Textarea value={draft.terms} onChange={onTerms} />
      </Field>
    </Grid>
  );
}

function FeaturesStep({ draft, update }: { draft: Draft; update: (patch: Partial<Draft>) => void }) {
  function toggleStore() {
    update({ storeOpen: !draft.storeOpen });
  }
  function toggleKiosk() {
    update({ kioskEnabled: !draft.kioskEnabled });
  }
  function toggleEinvoice() {
    update({ eInvoicing: !draft.eInvoicing });
  }
  function toggleLoose() {
    update({ looseDefault: !draft.looseDefault });
  }
  return (
    <Stack gap={1}>
      <WizardFeat icon={<IconStore size={18} />} title="Accept online orders" subtitle="List your store on the Namma MedMate customer app" checked={draft.storeOpen} onToggle={toggleStore} />
      <WizardFeat icon={<IconKiosk size={18} />} title="Self-order kiosk" subtitle="In-store screen for customers to order themselves" checked={draft.kioskEnabled} onToggle={toggleKiosk} />
      <WizardFeat icon={<IconReceipt size={18} />} title="e-Invoicing" subtitle="Generate IRN/e-invoices for B2B sales" checked={draft.eInvoicing} onToggle={toggleEinvoice} />
      <WizardFeat icon={<IconInventory size={18} />} title="Loose / per-tablet selling" subtitle="Allow selling individual tablets by default (per-strip eligible items)" checked={draft.looseDefault} onToggle={toggleLoose} />
      <ListRow
        title="Low-stock & expiry alerts"
        subtitle="Always on — dashboard flags items to reorder or that are expiring"
        leading={
          <Box className="grid h-9 w-9 place-items-center rounded-sm bg-wash text-mid">
            <IconUsers size={18} />
          </Box>
        }
        trailing={<Pill tone="green" dot>On</Pill>}
      />
    </Stack>
  );
}

function CatalogueStep() {
  return (
    <Stack align="center" gap={0} className="py-3.5 text-center">
      <Box className="inline-grid place-items-center overflow-hidden bg-wash text-mid">
        <IconFolder size={28} />
      </Box>
      <Heading level={2} className="mt-2 text-[23px]">
        Your catalogue starts empty
      </Heading>
      <Text className="mx-auto mt-2 max-w-[460px] text-[14px] text-muted">
        Add medicines under Inventory, or enter a distributor bill under Purchases and stock is created from that
        bill. Nothing is preloaded.
      </Text>
    </Stack>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justify="between" className="border-b border-line py-[7px] text-[12.5px]">
      <Text as="span" className="text-[12.5px] text-muted">
        {label}
      </Text>
      <Text as="span" className="text-right text-[12.5px] font-bold text-ink">
        {value}
      </Text>
    </Stack>
  );
}

function attached(value: string, file?: ProfileFile) {
  return `${value}${file?.dataUrl ? " · attached" : ""}`;
}

function ReviewStep({ draft }: { draft: Draft }) {
  return (
    <Stack gap={4}>
      <Stack direction="row" align="center" gap={3}>
        <Box className={cn("grid h-[52px] w-[52px] place-items-center overflow-hidden rounded-md", draft.logo ? "bg-dark" : "bg-wash")}>
          {draft.logo ? <Image src={draft.logo} alt="" fit="contain" className="h-full w-full" /> : <IconStore size={24} />}
        </Box>
        <Stack gap={0}>
          <Heading level={3} className="text-[18px]">
            {draft.name || "Your pharmacy"}
          </Heading>
          <Text as="span" className="text-[12.5px] text-muted">
            {draft.businessTypes.join(", ") || "Retail Pharmacy"} · {draft.city}, {draft.state}
          </Text>
        </Stack>
      </Stack>
      <Box className="grid grid-cols-2 gap-x-[18px] gap-y-1">
        <ReviewLine label="GSTIN" value={attached(draft.gstin, draft.gstFile)} />
        <ReviewLine label="PAN" value={attached(draft.pan, draft.panFile)} />
        <ReviewLine label="Drug Licence" value={attached(draft.dlNo, draft.dlFile)} />
        <ReviewLine label="FSSAI" value={attached(draft.fssai, draft.fssaiFile)} />
        <ReviewLine label="Trade Licence" value={attached(draft.tradeNo, draft.tradeFile)} />
        <ReviewLine label="Invoice prefix" value={draft.invoicePrefix} />
        <ReviewLine label="Pharmacist" value={draft.pharmacist.split(",")[0] || "—"} />
        <ReviewLine label="Signature" value={draft.signature ? "Attached" : "—"} />
        <ReviewLine label="Online orders" value={draft.storeOpen ? "On" : "Off"} />
        <ReviewLine label="Kiosk" value={draft.kioskEnabled ? "On" : "Off"} />
        <ReviewLine label="Loose selling" value={draft.looseDefault ? "On" : "Off"} />
        <ReviewLine label="Catalogue" value="Empty — you add stock" />
      </Box>
      <Alert tone="green" className="text-center">
        <Text as="span" className="text-[13px] text-mid">
          <IconSparkle size={13} /> You’re all set! Click <Text as="span" className="font-bold">Finish setup</Text> to open your dashboard.
        </Text>
      </Alert>
    </Stack>
  );
}

function StepBody({ step, draft, update }: { step: number; draft: Draft; update: (patch: Partial<Draft>) => void }) {
  if (step === 0) return <WelcomeStep />;
  if (step === 1) return <BusinessStep draft={draft} update={update} />;
  if (step === 2) return <LocationStep draft={draft} update={update} />;
  if (step === 3) return <TaxStep draft={draft} update={update} />;
  if (step === 4) return <PharmacistStep draft={draft} update={update} />;
  if (step === 5) return <InvoiceStep draft={draft} update={update} />;
  if (step === 6) return <FeaturesStep draft={draft} update={update} />;
  if (step === 7) return <CatalogueStep />;
  return <ReviewStep draft={draft} />;
}

export function SetupWizard({ className }: SetupWizardProps) {
  const { profile, invoiceSettings, kiosk, commitSetup, showFault, clearFault } = usePharma();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [draft, setDraft] = useState<Draft>({
    ...profile,
    gstRegistered: true,
    phone: profile.phone,
    invoicePrefix: invoiceSettings.prefix,
    terms: invoiceSettings.terms,
    kioskEnabled: kiosk.enabled,
    looseDefault: true,
  });
  function update(patch: Partial<Draft>) {
    setDraft(function merge(current) {
      return { ...current, ...patch };
    });
  }
  function blocked(through: number) {
    const issue = setupGap(draft);
    if (!issue || issue.step > through) {
      clearFault();
      return false;
    }
    setStep(issue.step);
    showFault(issue.message);
    return true;
  }
  async function finish() {
    if (savingRef.current) return;
    if (blocked(STEPS.length - 1)) return;
    savingRef.current = true;
    setSaving(true);
    const err = await commitSetup({
      profile: {
        name: draft.name,
        tagline: draft.tagline,
        logo: draft.logo,
        email: draft.email.trim(),
        address: draft.address,
        city: draft.city,
        state: draft.state,
        pincode: draft.pincode,
        gstRegistered: true,
        gstin: draft.gstin,
        eInvoicing: draft.eInvoicing,
        pan: draft.pan,
        dlNo: draft.dlNo,
        fssai: draft.fssai,
        tradeNo: draft.tradeNo,
        gstFile: draft.gstFile,
        panFile: draft.panFile,
        dlFile: draft.dlFile,
        fssaiFile: draft.fssaiFile,
        tradeFile: draft.tradeFile,
        enableTDS: draft.enableTDS,
        enableTCS: draft.enableTCS,
        businessTypes: draft.businessTypes,
        industryType: draft.industryType,
        registrationType: draft.registrationType,
        signature: draft.signature,
        pharmacist: draft.pharmacist,
        storeOpen: draft.storeOpen,
      },
      invoice: { prefix: draft.invoicePrefix, terms: draft.terms },
      kioskEnabled: draft.kioskEnabled,
      loose: draft.looseDefault,
    });
    savingRef.current = false;
    setSaving(false);
    if (err?.field === "gstin") setStep(3);
  }
  function onBack() {
    setStep(function previous(current) {
      return Math.max(0, current - 1);
    });
  }
  function onContinue() {
    if (!blocked(step)) {
      setStep(function next(current) {
        return current + 1;
      });
    }
  }
  const last = step === STEPS.length - 1;
  return (
    <Stack
      data-slot="setup-wizard"
      align="center"
      justify="center"
      className={cn(
        "fixed inset-0 z-[90] overflow-y-auto bg-[radial-gradient(60%_50%_at_50%_0%,rgba(143,212,168,0.18),transparent_60%),linear-gradient(135deg,#10301d,#0c2516)] p-6",
        className,
      )}
    >
      <Stack className="max-h-[92vh] w-full max-w-[800px] overflow-hidden rounded-[20px] bg-paper shadow-pop">
        <Stack className="border-b border-line px-[26px] pt-[18px] pb-[14px]">
          <Stack direction="row" align="center" justify="between">
            <Stack direction="row" align="center" gap={2}>
              <Box className="grid h-[30px] w-[30px] place-items-center rounded-sm bg-dark text-[15px] text-white">
                ＋
              </Box>
              <Heading level={4} className="text-[15px]">
                Namma MedMate · Store setup
              </Heading>
            </Stack>
            <Text as="span" className="text-[11.5px] font-bold text-muted">
              Step {step + 1} of {STEPS.length}
            </Text>
          </Stack>
          <Heading level={2} className="mt-2 text-[19px]">
            {STEPS[step].title}
          </Heading>
          <Text className="mt-0.5 text-[12.5px] text-muted">{STEPS[step].subtitle}</Text>
          <StepDots step={step} />
        </Stack>
        <Box className="overflow-y-auto px-[26px] py-[22px]">
          <StepBody step={step} draft={draft} update={update} />
        </Box>
        <Stack direction="row" align="center" justify="between" className="gap-2.5 border-t border-line px-[26px] py-[14px]">
          <Button variant="ghost" disabled={step === 0 || saving} onClick={onBack}>
            Back
          </Button>
          {last ? (
            <Button size="lg" disabled={saving} onClick={finish}>
              <IconCheck size={16} /> Finish setup
            </Button>
          ) : (
            <Button onClick={onContinue}>
              {step === 0 ? "Get started" : "Continue"} <IconArrowRight size={15} />
            </Button>
          )}
        </Stack>
      </Stack>
      <Text className="mt-3.5 block px-3 pt-2 pb-3 text-center text-[10px] [line-height:15px] tracking-[0.01em] text-faint">
        © 2026 Medmate India Technology Private Limited
      </Text>
    </Stack>
  );
}
