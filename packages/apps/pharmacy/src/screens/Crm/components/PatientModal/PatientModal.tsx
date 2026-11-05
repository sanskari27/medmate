import { useState, type ChangeEvent } from "react";
import { BLOOD_GROUPS, catLabel, fmtDateTime, inr, PAY_LABEL, timeAgo, type Sale } from "@/utils";
import { crmMsg, segLabel, type Patient, type PatientMed, type Redemption, type Segment } from "@/utils/calculations/crm";
import { Box, Button, Checkbox, Input, Pill, Progress, Select, Stack, Text } from "@/components/atoms";
import { IconCheck, IconClock, IconGift, IconHeart, IconMail, IconMessage, IconPhone, IconPill, IconReceipt, IconStar, IconUser, IconWhatsApp } from "@/components/atoms";
import { Card, CardBody, CardHeader } from "@/components/molecules/Card";
import { EmptyState } from "@/components/molecules/EmptyState";
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
  const reminders = view.crm.reminders.filter(function forPatient(item) { return item.custKey === patient.key; });
  const feedback = view.crm.feedbacks.filter(function forPatient(item) { return item.custKey === patient.key; });
  const redemptions = view.crm.redemptions.filter(function forPatient(item) { return item.custKey === patient.key; });
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
  function handleAge(event: ChangeEvent<HTMLInputElement>) { patchForm({ age: event.target.value }); }
  function handleGender(event: ChangeEvent<HTMLSelectElement>) { patchForm({ gender: event.target.value }); }
  function handleBlood(event: ChangeEvent<HTMLSelectElement>) { patchForm({ bloodGroup: event.target.value }); }
  function handleDob(event: ChangeEvent<HTMLInputElement>) { patchForm({ dob: event.target.value }); }
  function handleConditions(event: ChangeEvent<HTMLInputElement>) { patchForm({ conditions: event.target.value }); }
  function handleAllergies(event: ChangeEvent<HTMLInputElement>) { patchForm({ allergies: event.target.value }); }
  function handleAddress(event: ChangeEvent<HTMLInputElement>) { patchForm({ address: event.target.value }); }
  function handleNote(event: ChangeEvent<HTMLInputElement>) { patchForm({ note: event.target.value }); }
  function handleConsent(event: ChangeEvent<HTMLInputElement>) { patchForm({ consent: event.target.checked }); }
  function saveProfile() {
    view.setPatientMeta(patient.key, patientMetaFromForm(form));
  }
  function sendWhatsApp() {
    openWhatsApp(patient.phone, crmMsg.feedback(patient.name, view.profile.name));
  }
  function sendRefill() {
    if (!patient.refill) return;
    openWhatsApp(patient.phone, crmMsg.refill(patient.name, view.profile.name, patient.refill.med));
    view.logReminder({ custKey: patient.key, custName: patient.name, kind: "refill", channel: "whatsapp" });
  }
  function sendWinback() {
    openWhatsApp(patient.phone, crmMsg.winback(patient.name, view.profile.name));
    view.logReminder({ custKey: patient.key, custName: patient.name, kind: "winback", channel: "whatsapp" });
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
      className="max-w-5xl"
      onClose={onClose}
      footer={
        <Stack direction="row" justify="end" gap={2}>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={newSale}><IconReceipt size={15} /> New sale</Button>
        </Stack>
      }
    >
      <Box className="max-h-[60vh] overflow-y-auto">
        <Stack direction="row" align="center" gap={3} className="mb-3">
          <Box className="grid h-12 w-12 place-items-center rounded-full bg-wash font-display text-[16px] font-extrabold text-mid">
            {initials || <IconUser size={22} />}
          </Box>
          <Stack gap={1}>
            <Stack direction="row" align="center" wrap gap={2}>
              <Pill tone="gold">{patient.tier}</Pill>
              {patient.chronic ? <Pill tone="rose">chronic</Pill> : null}
            </Stack>
            <Stack direction="row" wrap gap={3}>
              <Text as="span" variant="caption"><IconPhone size={11} /> {patient.phone || "—"}</Text>
              {patient.email ? <Text as="span" variant="caption"><IconMail size={11} /> {patient.email}</Text> : null}
              <Text as="span" variant="caption"><IconClock size={11} /> {patient.daysSince === 0 ? "seen today" : `last seen ${timeAgo(patient.lastAt, view.now)}`}</Text>
            </Stack>
          </Stack>
        </Stack>

        <Stack direction="row" wrap gap={2} className="mb-3">
          <SegmentPills segments={patient.segments} />
          {patient.refill ? (
            <Pill tone={patient.refill.daysLeft <= 0 ? "rose" : "gold"}>
              Refill {patient.refill.daysLeft <= 0 ? "overdue" : `in ${patient.refill.daysLeft}d`}: {patient.refill.med}
            </Pill>
          ) : null}
        </Stack>
        <Stack direction="row" wrap gap={2} className="mb-4">
          <Button size="sm" disabled={!patient.phone} onClick={sendWhatsApp}><IconWhatsApp size={14} /> WhatsApp</Button>
          {patient.phone ? <Button asChild size="sm" variant="ghost"><a href={`tel:${patient.phone}`}><IconPhone size={14} /> Call</a></Button> : null}
          {patient.refill ? <Button size="sm" variant="ghost" disabled={!patient.phone} onClick={sendRefill}><IconClock size={14} /> Refill reminder</Button> : null}
          <Button size="sm" variant="ghost" disabled={!patient.phone} onClick={sendWinback}><IconHeart size={14} /> Win-back</Button>
          <Button size="sm" variant="ghost" disabled={available <= 0} onClick={redeem}><IconGift size={14} /> Redeem 50</Button>
          <Button size="sm" variant="ghost" onClick={newSale}><IconReceipt size={14} /> New sale</Button>
        </Stack>

        <Box className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi label="Lifetime spend" value={inr(patient.spent)} />
          <Kpi label="Orders" value={String(patient.orders)} />
          <Kpi label="Avg order" value={inr(patient.avgOrder)} />
          <Kpi label="Units bought" value={String(patient.units)} />
          <Kpi label="Points available" value={String(available)} />
          <Kpi label="RFM score" value={String(patient.rfm.score)} hint="/15" />
          <Kpi label="First visit" value={fmtDateTime(patient.firstAt).split(",")[0] ?? ""} small />
          <Kpi label="Days since" value={String(patient.daysSince)} hint="d" />
        </Box>

        {series.length >= 2 ? (
          <Card className="mb-3.5">
            <CardBody className="pt-4">
              <Stack direction="row" justify="between" className="mb-1">
                <Text className="text-[12.5px] font-bold">Spend per visit</Text>
                <Text variant="caption">{series.length} visits · online {patient.onlineOrders}/{patient.orders}</Text>
              </Stack>
              <PtSpark data={series} />
            </CardBody>
          </Card>
        ) : null}

        <Box className="grid gap-4 lg:grid-cols-2">
          <Stack gap={2}>
            <Text className="font-extrabold">Medicines bought <Text as="span" variant="caption">· {patient.medicines.length}</Text></Text>
            <Card>
              {patient.medicines.length === 0 ? <EmptyState title="—" className="py-4" /> : <MedicineRows medicines={patient.medicines.slice(0, 8)} now={view.now} />}
            </Card>
            {patient.categories.length > 0 ? (
              <Stack direction="row" wrap gap={1}>
                <CategoryPills categories={patient.categories} />
              </Stack>
            ) : null}
          </Stack>
          <Stack gap={2}>
            <Text className="font-extrabold">Purchase history <Text as="span" variant="caption">· {purchases.length}</Text></Text>
            <Card className="max-h-[260px] overflow-y-auto">
              {purchases.length === 0 ? <EmptyState title="No purchases." className="py-4" /> : <PurchaseRows sales={purchases.slice(0, 20)} />}
            </Card>
          </Stack>
        </Box>

        <Text className="mt-4 mb-2 font-extrabold">Loyalty & tier</Text>
        <Card className="mb-3">
          <CardBody className="pt-4">
            <Stack direction="row" justify="between" className="mb-1.5 text-[12.5px]">
              <Text as="span"><Pill tone="gold">{patient.tier}</Pill> · {patient.points} pts earned · {redeemed} redeemed</Text>
              <Text variant="caption">{tier.next ? `${tier.next.min - patient.points} pts to ${tier.next.tier}` : "Top tier reached"}</Text>
            </Stack>
            <Progress value={tier.progress} label="Tier progress" />
            {redemptions.length > 0 ? <Text variant="caption" className="mt-2">Recent: {redemptionSummary(redemptions.slice(0, 3))}</Text> : null}
          </CardBody>
        </Card>

        <Text className="mt-2 mb-2 font-extrabold">Clinical & personal profile</Text>
        <Box className="mb-2.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Age" htmlFor="patient-age"><Input id="patient-age" type="number" value={form.age} onChange={handleAge} placeholder="—" /></Field>
          <Field label="Gender" htmlFor="patient-gender">
            <Select id="patient-gender" value={form.gender} onChange={handleGender} options={[{ value: "", label: "\u2014" }, ...GenderOptions()]} />
          </Field>
          <Field label="Blood group" htmlFor="patient-blood">
            <Select id="patient-blood" value={form.bloodGroup} onChange={handleBlood} options={[{ value: "", label: "\u2014" }, ...BloodOptions()]} />
          </Field>
          <Field label="Date of birth" htmlFor="patient-dob"><Input id="patient-dob" type="date" value={form.dob} onChange={handleDob} /></Field>
          <Field label="Conditions (comma-sep)" htmlFor="patient-conditions" className="sm:col-span-2"><Input id="patient-conditions" value={form.conditions} onChange={handleConditions} placeholder="e.g. Diabetes, Hypertension" /></Field>
          <Field label="Allergies" htmlFor="patient-allergies" className="sm:col-span-2"><Input id="patient-allergies" value={form.allergies} onChange={handleAllergies} placeholder="e.g. Penicillin, Sulfa" /></Field>
          <Field label="Address" htmlFor="patient-address" className="sm:col-span-2"><Input id="patient-address" value={form.address} onChange={handleAddress} placeholder="Delivery / home address" /></Field>
          <Field label="Care note" htmlFor="patient-note" className="sm:col-span-2"><Input id="patient-note" value={form.note} onChange={handleNote} placeholder="Anything to remember for this patient…" /></Field>
        </Box>
        <Checkbox checked={form.consent} onChange={handleConsent} className="mb-2.5">Consent to WhatsApp/SMS reminders & offers</Checkbox>
        <Button size="sm" onClick={saveProfile}><IconCheck size={14} /> Save profile</Button>

        {reminders.length > 0 || feedback.length > 0 ? (
          <Stack gap={2} className="mt-4">
            <Text className="font-extrabold">Engagement history</Text>
            <Box className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader title="Reminders sent" subtitle={String(reminders.length)} />
                <CardBody>
                  {reminders.length === 0 ? <Text variant="muted">None yet.</Text> : <EngagementReminders reminders={reminders.slice(0, 5)} now={view.now} />}
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Feedback" subtitle={String(feedback.length)} />
                <CardBody>
                  {feedback.length === 0 ? <Text variant="muted">None yet.</Text> : <EngagementFeedback feedbacks={feedback.slice(0, 5)} now={view.now} />}
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
  return redemptions.map(function describe(item) {
    return `${item.points} pts (${inr(item.value)})`;
  }).join(" · ");
}

function Kpi({ label, value, hint, small = false }: { label: string; value: string; hint?: string; small?: boolean }) {
  return (
    <Box className="rounded-md border border-line bg-paper px-3 py-2">
      <Text variant="caption">{label}</Text>
      <Text className={small ? "text-[13px] font-extrabold" : "font-display text-[18px] font-extrabold text-dark"}>
        {value}{hint ? <Text as="span" variant="caption"> {hint}</Text> : null}
      </Text>
    </Box>
  );
}

function SegmentPills({ segments }: { segments: Segment[] }) {
  return segments.map(function renderPill(segment) {
    return <Pill key={segment} tone="green">{segLabel(segment)}</Pill>;
  });
}

function MedicineRows({ medicines, now }: { medicines: PatientMed[]; now: number }) {
  return medicines.map(function renderMedicine(medicine) {
    return (
      <Stack key={medicine.productId} direction="row" align="center" gap={2} className="border-b border-line px-3 py-2 last:border-0">
        <Box className="grid h-8 w-8 place-items-center rounded-md bg-wash text-mid"><IconPill size={14} /></Box>
        <Stack className="min-w-0 flex-1">
          <Text className="font-bold">{medicine.name}</Text>
          <Text variant="caption">{catLabel(medicine.category)} · {medicine.orders}× · last {timeAgo(medicine.lastAt, now)}</Text>
        </Stack>
        <Pill tone="gray">{medicine.qty} u</Pill>
      </Stack>
    );
  });
}

function CategoryPills({ categories }: { categories: string[] }) {
  return categories.map(function renderCategory(category) {
    return <Pill key={category} tone="gray">{catLabel(category)}</Pill>;
  });
}

function PurchaseRows({ sales }: { sales: Sale[] }) {
  return sales.map(function renderSale(sale) {
    return (
      <Stack key={sale.id} direction="row" align="center" gap={2} className="border-b border-line px-3 py-2 last:border-0">
        <Box className="grid h-8 w-8 place-items-center rounded-md bg-wash text-mid"><IconReceipt size={14} /></Box>
        <Stack className="min-w-0 flex-1">
          <Text className="font-mono font-bold">{sale.id} {sale.paid === false ? <Pill tone="rose">unpaid</Pill> : null}</Text>
          <Text variant="caption">{fmtDateTime(sale.createdAt)} · {saleItemCount(sale)} items · {sale.channel === "online" ? "Online" : "Counter"} · {PAY_LABEL[sale.payMode]}</Text>
        </Stack>
        <Text className="text-[13px] font-extrabold">{inr(salePayable(sale))}</Text>
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

function EngagementReminders({ reminders, now }: { reminders: CrmViewProps["crm"]["reminders"]; now: number }) {
  return reminders.map(function renderReminder(reminder) {
    return (
      <Stack key={reminder.id} direction="row" align="center" gap={2} className="border-b border-line py-2 last:border-0">
        <IconMessage size={13} />
        <Stack className="min-w-0 flex-1">
          <Text className="font-bold capitalize">{reminder.kind}</Text>
          <Text variant="caption">{reminder.channel}</Text>
        </Stack>
        <Text variant="caption">{timeAgo(reminder.at, now)}</Text>
      </Stack>
    );
  });
}

function EngagementFeedback({ feedbacks, now }: { feedbacks: CrmViewProps["crm"]["feedbacks"]; now: number }) {
  return feedbacks.map(function renderFeedback(item) {
    return (
      <Stack key={item.id} direction="row" align="center" gap={2} className="border-b border-line py-2 last:border-0">
        <Stack direction="row" className="text-gold-d"><Stars count={item.rating} /></Stack>
        <Stack className="min-w-0 flex-1">
          <Text className="font-bold">{item.comment || "—"}</Text>
          <Text variant="caption">{item.nps != null ? `NPS ${item.nps}` : ""}</Text>
        </Stack>
        <Text variant="caption">{timeAgo(item.at, now)}</Text>
      </Stack>
    );
  });
}

function Stars({ count }: { count: number }) {
  return [1, 2, 3, 4, 5].slice(0, count).map(function renderStar(score) {
    return <IconStar key={score} size={12} />;
  });
}
