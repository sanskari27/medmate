import { useState, type ChangeEvent } from "react";
import { timeAgo } from "@/utils";
import { crmMsg, type Feedback, type Patient } from "@/utils/calculations/crm";
import { Box, Button, Heading, Input, Select, Stack, Text, Textarea } from "@/components/atoms";
import { IconCheck, IconStar, IconWhatsApp } from "@/components/atoms";
import { Card, CardBody } from "@/components/molecules/Card";
import { Field } from "@/components/molecules/Field";
import type { CrmViewProps } from "@/screens/Crm/Crm.types";
import { clampNps, feedbackScore, openWhatsApp } from "@/screens/Crm/Crm.utils";

import type { FeedbackTabProps } from "./FeedbackTab.types";
export function FeedbackTab({ view }: FeedbackTabProps) {
  const [patientKey, setPatientKey] = useState("");
  const [rating, setRating] = useState(5);
  const [nps, setNps] = useState(9);
  const [comment, setComment] = useState("");
  const score = feedbackScore(view.crm.feedbacks);

  function handlePatient(event: ChangeEvent<HTMLSelectElement>) {
    setPatientKey(event.target.value);
  }
  function handleNps(event: ChangeEvent<HTMLInputElement>) {
    setNps(clampNps(event.target.value));
  }
  function handleComment(event: ChangeEvent<HTMLTextAreaElement>) {
    setComment(event.target.value);
  }
  async function save() {
    const patient = view.patients.find(function match(item) { return item.key === patientKey; });
    if (!patient) return;
    const error = await view.addFeedback({
      custKey: patient.key,
      custName: patient.name,
      rating,
      nps,
      comment: comment.trim() || undefined,
    });
    if (!error) setComment("");
  }
  function requestFeedback() {
    const patient = view.patients.find(function match(item) { return item.key === patientKey; });
    if (patient) openWhatsApp(patient.phone, crmMsg.feedback(patient.name, view.profile.name));
  }

  return (
    <Box className="grid grid-cols-1 gap-4 min-[768px]:grid-cols-[1.5fr_1fr]">
      <Card className="rounded-md shadow-sm">
        <Stack direction="row" align="center" className="border-b border-line px-[18px] py-[15px]">
          <Heading level={3} className="text-[15px] font-bold tracking-normal">Log feedback</Heading>
        </Stack>
        <CardBody className="px-[18px] pb-[18px]">
          <Stack gap={3}>
            <Field label="Patient" htmlFor="feedback-patient">
              <Select id="feedback-patient" value={patientKey} onChange={handlePatient} options={[{ value: "", label: "Select patient\u2026" }, ...PatientOptions({patients: view.patients})]} />
            </Field>
            <Field label="Rating">
              <Stack direction="row" gap={2}>
                <StarButtons rating={rating} onSelect={setRating} />
              </Stack>
            </Field>
            <Field label="NPS (0–10): would they recommend us?" htmlFor="feedback-nps">
              <Input id="feedback-nps" type="number" min={0} max={10} value={nps} onChange={handleNps} className="w-[90px]" />
            </Field>
            <Field label="Comment" htmlFor="feedback-comment">
              <Textarea id="feedback-comment" rows={3} value={comment} onChange={handleComment} placeholder="What did they say?" />
            </Field>
            <Stack direction="row" wrap gap={2}>
              <Button disabled={!patientKey} onClick={save}><IconCheck size={15} /> Save feedback</Button>
              <Button variant="ghost" disabled={!patientKey} onClick={requestFeedback}><IconWhatsApp size={15} /> Request via WhatsApp</Button>
            </Stack>
          </Stack>
        </CardBody>
      </Card>
      <Card className="rounded-md shadow-sm">
        <Stack direction="row" align="center" justify="between" className="border-b border-line px-[18px] py-[15px]">
          <Heading level={3} className="text-[15px] font-bold tracking-normal">Feedback & NPS</Heading>
          <Text className="text-[12.5px] text-muted">{view.crm.feedbacks.length} responses</Text>
        </Stack>
        <CardBody className="px-[18px] pb-[18px]">
          <Stack direction="row" wrap gap={2} className="mb-3">
            <SummaryChip label="Avg rating" value={score.average ? score.average.toFixed(1) : "—"} star />
            <SummaryChip label="NPS" value={view.crm.feedbacks.length ? String(score.nps) : "—"} />
            <SummaryChip label="Promoters" value={String(score.promoters)} />
            <SummaryChip label="Detractors" value={String(score.detractors)} />
          </Stack>
          {view.crm.feedbacks.length === 0 ? <Text className="px-4 py-4 text-center text-[13px] text-muted">No feedback yet.</Text> : <FeedbackRows feedbacks={view.crm.feedbacks.slice(0, 10)} now={view.now} />}
        </CardBody>
      </Card>
    </Box>
  );
}

function PatientOptions({ patients }: { patients: Patient[] }) {
  return patients.map(function renderOption(patient) {
    return { value: String(patient.key), label: String(patient.name) };
  });
}

function StarButtons({ rating, onSelect }: { rating: number; onSelect: (rating: number) => void }) {
  return [1, 2, 3, 4, 5].map(function renderStar(score) {
    return <StarButton key={score} score={score} selected={rating >= score} onSelect={onSelect} />;
  });
}

function StarButton({ score, selected, onSelect }: { score: number; selected: boolean; onSelect: (rating: number) => void }) {
  function handleSelect() {
    onSelect(score);
  }
  return (
    <Button variant={selected ? "primary" : "ghost"} aria-label={`${score} star`} onClick={handleSelect}>
      <IconStar size={15} />
    </Button>
  );
}

function SummaryChip({ label, value, star = false }: { label: string; value: string; star?: boolean }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2 text-[12.5px] text-muted">
      {label}
      <Text className="mt-px flex items-center gap-1 font-display text-[15px] font-extrabold text-dark">
        {value} {star && value !== "—" ? <IconStar size={11} /> : null}
      </Text>
    </Box>
  );
}

function FeedbackRows({ feedbacks, now }: { feedbacks: Feedback[]; now: number }) {
  return feedbacks.map(function renderFeedback(item) {
    return (
      <Stack key={item.id} direction="row" align="center" gap={2} className="border-b border-line py-2 last:border-0">
        <Stack direction="row" className="text-gold-d"><Stars count={item.rating} /></Stack>
        <Stack className="min-w-0 flex-1">
          <Text className="font-bold">{item.custName} {item.nps != null ? <Text as="span" variant="caption">· NPS {item.nps}</Text> : null}</Text>
          <Text variant="caption">{item.comment || "—"}</Text>
        </Stack>
        <Text variant="caption">{timeAgo(item.at, now)}</Text>
      </Stack>
    );
  });
}

function Stars({ count }: { count: number }) {
  return [1, 2, 3, 4, 5].slice(0, count).map(function renderStar(score) {
    return <IconStar key={score} size={13} />;
  });
}
