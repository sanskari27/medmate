import { useState, type ChangeEvent } from "react";
import { BLOOD_GROUPS, catLabel, fmtDateTime, inr, PAY_LABEL, timeAgo, type Sale } from "@/utils";
import {
  crmMsg,
  segLabel,
  type PatientMed,
  type Redemption,
  type Segment,
} from "@/utils/calculations/crm";
import {
  Box,
  Button,
  Checkbox,
  Heading,
  Input,
  Pill,
  Select,
  Stack,
  Text,
} from "@/components/atoms";
import {
  IconCheck,
  IconClock,
  IconGift,
  IconHeart,
  IconMail,
  IconMessage,
  IconPhone,
  IconPill,
  IconReceipt,
  IconStar,
  IconUser,
  IconWhatsApp,
} from "@/components/atoms";
import { Card, CardBody } from "@/components/molecules/Card";
import { Field } from "@/components/molecules/Field";
import { Modal } from "@/components/molecules/Modal";
import type { CrmViewProps, PatientProfileForm } from "@/screens/Crm/Crm.types";
import { PATIENT_GENDERS } from "@/screens/Crm/Crm.types";
import {
  availablePoints,
  loyaltyTierProgress,
  openWhatsApp,
  patientInitials,
  patientMetaFromForm,
  patientProfileForm,
  patientPurchases,
  saleItemCount,
  salePayable,
  spendSeries,
} from "@/screens/Crm/Crm.utils";
import { PtSpark } from "@/screens/Crm/components/PtSpark";

import type { PatientModalProps } from "./PatientModal.types";
export function PatientModal({ patient, onClose, view }: PatientModalProps) {
  const available = availablePoints(patient, view.redeemedBy);
  const redeemed = view.redeemedBy.get(patient.key) ?? 0;
  const purchases = patientPurchases(view.sales, patient.key);
  const series = spendSeries(purchases);
  const reminders = view.crm.reminders.filter(function forPatient(item) {
    return item.custKey === patient.key;
  });
  const feedback = view.crm.feedbacks.filter(function forPatient(item) {
    return item.custKey === patient.key;
  });
  const redemptions = view.crm.redemptions.filter(function forPatient(item) {
    return item.custKey === patient.key;
  });
  const tier = loyaltyTierProgress(patient);
  const initials = patientInitials(patient.name);
  const [form, setForm] = useState<PatientProfileForm>(function initialForm() {
    return patientProfileForm(patient.meta);
  });

  function patchForm(patch: Partial<PatientProfileForm>) {
    setForm(function next(current) {
      return { ...current, ...patch };
    });
  }
  function handleAge(event: ChangeEvent<HTMLInputElement>) {
    patchForm({ age: event.target.value });
  }
  function handleGender(event: ChangeEvent<HTMLSelectElement>) {
    patchForm({ gender: event.target.value });
  }
  function handleBlood(event: ChangeEvent<HTMLSelectElement>) {
    patchForm({ bloodGroup: event.target.value });
  }
  function handleDob(event: ChangeEvent<HTMLInputElement>) {
    patchForm({ dob: event.target.value });
  }
  function handleConditions(event: ChangeEvent<HTMLInputElement>) {
    patchForm({ conditions: event.target.value });
  }
  function handleAllergies(event: ChangeEvent<HTMLInputElement>) {
    patchForm({ allergies: event.target.value });
  }
  function handleAddress(event: ChangeEvent<HTMLInputElement>) {
    patchForm({ address: event.target.value });
  }
  function handleNote(event: ChangeEvent<HTMLInputElement>) {
    patchForm({ note: event.target.value });
  }
  function handleConsent(event: ChangeEvent<HTMLInputElement>) {
    patchForm({ consent: event.target.checked });
  }
  function saveProfile() {
    view.setPatientMeta(patient.key, patientMetaFromForm(form));
  }
  function sendWhatsApp() {
    openWhatsApp(patient.phone, crmMsg.feedback(patient.name, view.profile.name));
  }
  function sendRefill() {
    if (!patient.refill) return;
    openWhatsApp(patient.phone, crmMsg.refill(patient.name, view.profile.name, patient.refill.med));
    view.logReminder({
      custKey: patient.key,
      custName: patient.name,
      kind: "refill",
      channel: "whatsapp",
    });
  }
  function sendWinback() {
    openWhatsApp(patient.phone, crmMsg.winback(patient.name, view.profile.name));
    view.logReminder({
      custKey: patient.key,
      custName: patient.name,
      kind: "winback",
      channel: "whatsapp",
    });
  }
  function redeem() {
    view.redeemPoints(patient.key, patient.name, Math.min(available, 50));
  }
  function newSale() {
    onClose();
    view.go("pos");
  }

  return (
    <Modal
      title={patient.name}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={newSale}>
            <IconReceipt size={15} /> New sale
          </Button>
        </>
      }
    >
      <Box>
        <Stack direction="row" align="center" className="mb-3 gap-[13px]">
          <Box className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-mid to-dark font-display text-[17px] font-extrabold text-white">
            {initials || <IconUser size={22} />}
          </Box>
          <Stack gap={0} className="min-w-0">
            <Stack direction="row" align="center" wrap className="gap-2">
              <Pill tone="gold">{patient.tier}</Pill>
              {patient.chronic ? <Pill tone="rose">chronic</Pill> : null}
            </Stack>
            <Stack
              direction="row"
              wrap
              className="mt-[3px] gap-3 text-[12.5px] text-muted [&_svg]:align-[-1px]"
            >
              <Text as="span" className="!text-[12.5px] !text-muted">
                <IconPhone size={11} /> {patient.phone || "—"}
              </Text>
              {patient.email ? (
                <Text as="span" className="!text-[12.5px] !text-muted">
                  <IconMail size={11} /> {patient.email}
                </Text>
              ) : null}
              <Text as="span" className="!text-[12.5px] !text-muted">
                <IconClock size={11} />{" "}
                {patient.daysSince === 0
                  ? "seen today"
                  : `last seen ${timeAgo(patient.lastAt, view.now)}`}
              </Text>
            </Stack>
          </Stack>
        </Stack>

        <Stack direction="row" wrap className="mb-3 gap-1.5">
          <SegmentPills segments={patient.segments} />
          {patient.refill ? (
            <Pill tone={patient.refill.daysLeft <= 0 ? "rose" : "gold"}>
              Refill {patient.refill.daysLeft <= 0 ? "overdue" : `in ${patient.refill.daysLeft}d`}:{" "}
              {patient.refill.med}
            </Pill>
          ) : null}
        </Stack>
        <Stack direction="row" wrap className="mb-4 gap-1.5">
          <Button size="sm" disabled={!patient.phone} onClick={sendWhatsApp}>
            <IconWhatsApp size={14} /> WhatsApp
          </Button>
          {patient.phone ? (
            <Button asChild size="sm" variant="ghost">
              <a href={`tel:${patient.phone}`}>
                <IconPhone size={14} /> Call
              </a>
            </Button>
          ) : null}
          {patient.refill ? (
            <Button size="sm" variant="ghost" disabled={!patient.phone} onClick={sendRefill}>
              <IconClock size={14} /> Refill reminder
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" disabled={!patient.phone} onClick={sendWinback}>
            <IconHeart size={14} /> Win-back
          </Button>
          <Button size="sm" variant="ghost" disabled={available <= 0} onClick={redeem}>
            <IconGift size={14} /> Redeem 50
          </Button>
          <Button size="sm" variant="ghost" onClick={newSale}>
            <IconReceipt size={14} /> New sale
          </Button>
        </Stack>

        <Box className="mb-3.5 grid grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line max-[767px]:grid-cols-2">
          <Kpi label="Lifetime spend" value={inr(patient.spent)} />
          <Kpi label="Orders" value={String(patient.orders)} />
          <Kpi label="Avg order" value={inr(patient.avgOrder)} />
          <Kpi label="Units bought" value={String(patient.units)} />
          <Kpi label="Points available" value={String(available)} />
          <Kpi label="RFM score" value={String(patient.rfm.score)} hint=" /15" />
          <Kpi label="First visit" value={fmtDateTime(patient.firstAt).split(",")[0] ?? ""} small />
          <Kpi label="Days since" value={String(patient.daysSince)} hint="d" />
        </Box>

        {series.length >= 2 ? (
          <Card className="mb-3.5 !rounded-md !shadow-sm">
            <CardBody className="!p-[18px]">
              <Stack direction="row" justify="between" className="mb-1">
                <Text className="!text-[12.5px] !font-bold !text-ink">Spend per visit</Text>
                <Text className="!text-[11.5px] !text-muted">
                  {series.length} visits · online {patient.onlineOrders}/{patient.orders}
                </Text>
              </Stack>
              <PtSpark data={series} />
            </CardBody>
          </Card>
        ) : null}

        <Box className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
          <Stack gap={0}>
            <Text className="!mt-0 !mb-0.5 !text-[11px] !font-extrabold !uppercase !tracking-[0.08em] !text-faint">
              Medicines bought{" "}
              <Text
                as="span"
                className="!text-[12px] !font-medium !normal-case !tracking-normal !text-muted"
              >
                · {patient.medicines.length}
              </Text>
            </Text>
            <Card className="!rounded-md !shadow-sm">
              {patient.medicines.length === 0 ? (
                <Text className="mx-auto max-w-[340px] px-4 py-4 text-center !text-[13px] !text-muted">
                  —
                </Text>
              ) : (
                <MedicineRows medicines={patient.medicines.slice(0, 8)} now={view.now} />
              )}
            </Card>
            {patient.categories.length > 0 ? (
              <Stack direction="row" wrap className="mt-2 gap-[5px]">
                <CategoryPills categories={patient.categories} />
              </Stack>
            ) : null}
          </Stack>
          <Stack gap={0}>
            <Text className="!mt-0 !mb-0.5 !text-[11px] !font-extrabold !uppercase !tracking-[0.08em] !text-faint">
              Purchase history{" "}
              <Text
                as="span"
                className="!text-[12px] !font-medium !normal-case !tracking-normal !text-muted"
              >
                · {purchases.length}
              </Text>
            </Text>
            <Card className="max-h-[260px] overflow-y-auto !rounded-md !shadow-sm">
              {purchases.length === 0 ? (
                <Text className="mx-auto max-w-[340px] px-4 py-4 text-center !text-[13px] !text-muted">
                  No purchases.
                </Text>
              ) : (
                <PurchaseRows sales={purchases.slice(0, 20)} />
              )}
            </Card>
          </Stack>
        </Box>

        <Text className="!mt-4 !mb-0.5 !text-[11px] !font-extrabold !uppercase !tracking-[0.08em] !text-faint">
          Loyalty & tier
        </Text>
        <Card className="mb-3 !rounded-md !shadow-sm">
          <CardBody className="!p-[18px]">
            <Stack direction="row" justify="between" className="mb-1.5 text-[12.5px]">
              <Text as="span" className="!text-[12.5px]">
                <Pill tone="gold">{patient.tier}</Pill> · {patient.points} pts earned · {redeemed}{" "}
                redeemed
              </Text>
              <Text className="!text-[12.5px] !text-muted">
                {tier.next
                  ? `${tier.next.min - patient.points} pts to ${tier.next.tier}`
                  : "Top tier reached"}
              </Text>
            </Stack>
            <Box
              className="h-2 overflow-hidden rounded-[5px] bg-wash"
              role="progressbar"
              aria-label="Tier progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(tier.progress)}
            >
              <Box
                className="h-full rounded-[5px] bg-gradient-to-r from-gold to-gold-d transition-[width] duration-300"
                style={{ width: tier.progress + "%" }}
              />
            </Box>
            {redemptions.length > 0 ? (
              <Text className="mt-2 !text-[11.5px] !text-muted">
                Recent: {redemptionSummary(redemptions.slice(0, 3))}
              </Text>
            ) : null}
          </CardBody>
        </Card>

        <Text className="!mt-4 !mb-0.5 !text-[11px] !font-extrabold !uppercase !tracking-[0.08em] !text-faint">
          Clinical & personal profile
        </Text>
        <Box className="mb-2.5 grid grid-cols-2 gap-3.5 max-[767px]:grid-cols-1">
          <Field label="Age" htmlFor="patient-age">
            <Input
              id="patient-age"
              type="number"
              value={form.age}
              onChange={handleAge}
              placeholder="—"
            />
          </Field>
          <Field label="Gender" htmlFor="patient-gender">
            <Select
              id="patient-gender"
              value={form.gender}
              onChange={handleGender}
              options={[{ value: "", label: "\u2014" }, ...GenderOptions()]}
            />
          </Field>
          <Field label="Blood group" htmlFor="patient-blood">
            <Select
              id="patient-blood"
              value={form.bloodGroup}
              onChange={handleBlood}
              options={[{ value: "", label: "\u2014" }, ...BloodOptions()]}
            />
          </Field>
          <Field label="Date of birth" htmlFor="patient-dob">
            <Input id="patient-dob" type="date" value={form.dob} onChange={handleDob} />
          </Field>
          <Field
            label="Conditions (comma-sep)"
            htmlFor="patient-conditions"
            className="col-span-2 max-[767px]:col-span-1"
          >
            <Input
              id="patient-conditions"
              value={form.conditions}
              onChange={handleConditions}
              placeholder="e.g. Diabetes, Hypertension"
            />
          </Field>
          <Field
            label="Allergies"
            htmlFor="patient-allergies"
            className="col-span-2 max-[767px]:col-span-1"
          >
            <Input
              id="patient-allergies"
              value={form.allergies}
              onChange={handleAllergies}
              placeholder="e.g. Penicillin, Sulfa"
            />
          </Field>
          <Field
            label="Address"
            htmlFor="patient-address"
            className="col-span-2 max-[767px]:col-span-1"
          >
            <Input
              id="patient-address"
              value={form.address}
              onChange={handleAddress}
              placeholder="Delivery / home address"
            />
          </Field>
          <Field
            label="Care note"
            htmlFor="patient-note"
            className="col-span-2 max-[767px]:col-span-1"
          >
            <Input
              id="patient-note"
              value={form.note}
              onChange={handleNote}
              placeholder="Anything to remember for this patient…"
            />
          </Field>
        </Box>
        <Box className="mb-2.5">
          <Checkbox checked={form.consent} onChange={handleConsent}>
            Consent to WhatsApp/SMS reminders & offers
          </Checkbox>
        </Box>
        <Button size="sm" onClick={saveProfile}>
          <IconCheck size={14} /> Save profile
        </Button>

        {reminders.length > 0 || feedback.length > 0 ? (
          <Stack gap={0}>
            <Text className="!mt-4 !mb-0.5 !text-[11px] !font-extrabold !uppercase !tracking-[0.08em] !text-faint">
              Engagement history
            </Text>
            <Box className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
              <Card className="!rounded-md !shadow-sm">
                <Stack
                  direction="row"
                  align="center"
                  justify="between"
                  wrap
                  className="gap-2.5 border-b border-line px-[18px] py-[15px]"
                >
                  <Heading level={3} className="!text-[13px] !font-bold !tracking-normal">
                    Reminders sent
                  </Heading>
                  <Text className="!text-[12.5px] !text-muted">{reminders.length}</Text>
                </Stack>
                <CardBody className="!px-[18px] !pt-1 !pb-[18px]">
                  {reminders.length === 0 ? (
                    <Text className="!text-[12px] !text-muted">None yet.</Text>
                  ) : (
                    <EngagementReminders reminders={reminders.slice(0, 5)} now={view.now} />
                  )}
                </CardBody>
              </Card>
              <Card className="!rounded-md !shadow-sm">
                <Stack
                  direction="row"
                  align="center"
                  justify="between"
                  wrap
                  className="gap-2.5 border-b border-line px-[18px] py-[15px]"
                >
                  <Heading level={3} className="!text-[13px] !font-bold !tracking-normal">
                    Feedback
                  </Heading>
                  <Text className="!text-[12.5px] !text-muted">{feedback.length}</Text>
                </Stack>
                <CardBody className="!px-[18px] !pt-1 !pb-[18px]">
                  {feedback.length === 0 ? (
                    <Text className="!text-[12px] !text-muted">None yet.</Text>
                  ) : (
                    <EngagementFeedback feedbacks={feedback.slice(0, 5)} now={view.now} />
                  )}
                </CardBody>
              </Card>
            </Box>
          </Stack>
        ) : null}
      </Box>
    </Modal>
  );
}

function redemptionSummary(redemptions: Redemption[]) {
  return redemptions
    .map(function describe(item) {
      return `${item.points} pts (${inr(item.value)})`;
    })
    .join(" · ");
}

function Kpi({
  label,
  value,
  hint,
  small = false,
}: {
  label: string;
  value: string;
  hint?: string;
  small?: boolean;
}) {
  return (
    <Box className="flex flex-col gap-0.5 bg-paper px-3 py-2.5">
      <Text className="!text-[10.5px] !font-bold !uppercase !tracking-[0.04em] !text-faint">
        {label}
      </Text>
      <Text
        className={
          small
            ? "!text-[13px] !font-extrabold !text-dark"
            : "!font-display !text-[17px] !font-extrabold !text-dark"
        }
      >
        {value}
        {hint ? (
          <Text as="span" className="!text-[11px] !font-semibold !text-muted">
            {hint}
          </Text>
        ) : null}
      </Text>
    </Box>
  );
}

function SegmentPills({ segments }: { segments: Segment[] }) {
  return segments.map(function renderPill(segment) {
    return (
      <Pill key={segment} tone="green">
        {segLabel(segment)}
      </Pill>
    );
  });
}

function MedicineRows({ medicines, now }: { medicines: PatientMed[]; now: number }) {
  return medicines.map(function renderMedicine(medicine) {
    return (
      <Stack
        key={medicine.productId}
        direction="row"
        align="center"
        className="gap-2.5 border-b border-line px-[13px] py-2 last:border-0"
      >
        <Box className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-sm bg-wash text-mid">
          <IconPill size={14} />
        </Box>
        <Stack className="min-w-0 flex-1 gap-0">
          <Text className="truncate !text-[12.5px] !font-bold !text-ink">{medicine.name}</Text>
          <Text className="truncate !text-[11px] !text-muted">
            {catLabel(medicine.category)} · {medicine.orders}× · last{" "}
            {timeAgo(medicine.lastAt, now)}
          </Text>
        </Stack>
        <Pill tone="gray">{medicine.qty} u</Pill>
      </Stack>
    );
  });
}

function CategoryPills({ categories }: { categories: string[] }) {
  return categories.map(function renderCategory(category) {
    return (
      <Pill key={category} tone="gray">
        {catLabel(category)}
      </Pill>
    );
  });
}

function PurchaseRows({ sales }: { sales: Sale[] }) {
  return sales.map(function renderSale(sale) {
    return (
      <Stack
        key={sale.id}
        direction="row"
        align="center"
        className="gap-2.5 border-b border-line px-[13px] py-2 last:border-0"
      >
        <Box className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-sm bg-wash text-mid">
          <IconReceipt size={14} />
        </Box>
        <Stack className="min-w-0 flex-1 gap-0">
          <Text className="truncate font-mono !text-[12.5px] !font-bold !text-ink">
            {sale.id}{" "}
            {sale.paid === false ? (
              <Pill tone="rose" className="!text-[10px]">
                unpaid
              </Pill>
            ) : null}
          </Text>
          <Text className="truncate !text-[11px] !text-muted">
            {fmtDateTime(sale.createdAt)} · {saleItemCount(sale)} items ·{" "}
            {sale.channel === "online" ? "Online" : "Counter"} · {PAY_LABEL[sale.payMode]}
          </Text>
        </Stack>
        <Text className="!text-[13px] !font-extrabold !text-ink">{inr(salePayable(sale))}</Text>
      </Stack>
    );
  });
}

function GenderOptions() {
  return PATIENT_GENDERS.map(function renderGender(gender) {
    return { value: String(gender), label: String(gender) };
  });
}

function BloodOptions() {
  return BLOOD_GROUPS.map(function renderBlood(group) {
    return { value: String(group), label: String(group) };
  });
}

function EngagementReminders({
  reminders,
  now,
}: {
  reminders: CrmViewProps["crm"]["reminders"];
  now: number;
}) {
  return reminders.map(function renderReminder(reminder) {
    return (
      <Stack
        key={reminder.id}
        direction="row"
        align="center"
        className="gap-2.5 border-b border-line px-[13px] py-2 last:border-0"
      >
        <Box className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-sm bg-wash text-mid">
          <IconMessage size={13} />
        </Box>
        <Stack className="min-w-0 flex-1 gap-0">
          <Text className="truncate !text-[12.5px] !font-bold !text-ink capitalize">
            {reminder.kind}
          </Text>
          <Text className="truncate !text-[11px] !text-muted">{reminder.channel}</Text>
        </Stack>
        <Text className="!text-[11px] !text-muted">{timeAgo(reminder.at, now)}</Text>
      </Stack>
    );
  });
}

function EngagementFeedback({
  feedbacks,
  now,
}: {
  feedbacks: CrmViewProps["crm"]["feedbacks"];
  now: number;
}) {
  return feedbacks.map(function renderFeedback(item) {
    return (
      <Stack
        key={item.id}
        direction="row"
        align="center"
        className="gap-2.5 border-b border-line px-[13px] py-2 last:border-0"
      >
        <Stack direction="row" className="shrink-0 gap-px text-gold-d">
          <Stars count={item.rating} />
        </Stack>
        <Stack className="min-w-0 flex-1 gap-0">
          <Text className="truncate !text-[12.5px] !font-bold !text-ink">
            {item.comment || "—"}
          </Text>
          <Text className="truncate !text-[11px] !text-muted">
            {item.nps != null ? `NPS ${item.nps}` : ""}
          </Text>
        </Stack>
        <Text className="!text-[11px] !text-muted">{timeAgo(item.at, now)}</Text>
      </Stack>
    );
  });
}

function Stars({ count }: { count: number }) {
  return [1, 2, 3, 4, 5].slice(0, count).map(function renderStar(score) {
    return <IconStar key={score} size={12} />;
  });
}
