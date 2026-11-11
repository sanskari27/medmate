import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { IconArrowRight, IconCheck } from "@/components/ui/Icon";
import { applicationForm, applyPatch, draftFromApplication } from "../draft";
import { STEPS } from "../options";
import { stepIssue } from "../setupValidation";
import type { PharmacyApplication, Rejection } from "../types";
import {
  BusinessStep,
  FeaturesStep,
  InvoiceStep,
  LocationStep,
  PharmacistStep,
  ReviewStep,
  TaxStep,
  WelcomeStep,
} from "./steps";

type SetupWizardProps = {
  phone: string;
  application: PharmacyApplication;
  onSubmit: (body: FormData) => Promise<string | null>;
  onSignOut: () => void;
};

function stageLabel(stage: string) {
  return stage === "admin" ? "Admin" : "Compliance";
}

export function SetupWizard({ phone, application, onSubmit, onSignOut }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => draftFromApplication(application));
  const [issue, setIssue] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const rejection: Rejection | null = application.rejection;
  const last = step === STEPS.length - 1;

  function onBack() {
    setIssue(null);
    setStep((current) => Math.max(0, current - 1));
  }

  function onContinue() {
    const next = stepIssue(draft, step);
    if (next) {
      setIssue(next);
      return;
    }
    setIssue(null);
    setStep((current) => current + 1);
  }

  async function finish() {
    if (saving) return;
    const blocked = [1, 2, 3, 4, 5]
      .map((index) => ({ index, message: stepIssue(draft, index) }))
      .find((item) => item.message);
    if (blocked?.message) {
      setStep(blocked.index);
      setIssue(blocked.message);
      setConfirming(false);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    const error = await onSubmit(applicationForm(draft));
    setSaving(false);
    setConfirming(false);
    if (error) setSubmitError(error);
  }

  return (
    <Stack
      align="center"
      justify="center"
      className="fixed inset-0 z-[90] overflow-y-auto bg-[radial-gradient(60%_50%_at_50%_0%,rgba(143,212,168,0.18),transparent_60%),linear-gradient(135deg,#10301d,#0c2516)] p-6"
    >
      <Stack className="max-h-[92vh] min-h-0 w-full max-w-[800px] overflow-hidden rounded-[20px] bg-paper shadow-pop">
        <Stack className="border-b border-line px-[26px] pt-[18px] pb-[14px]">
          <Stack direction="row" align="center" justify="between">
            <Stack direction="row" align="center" gap={2}>
              <Box className="grid h-[30px] w-[30px] place-items-center rounded-sm bg-dark text-[15px] text-white">
                +
              </Box>
              <Text as="span" className="font-display text-[15px] font-bold text-dark">
                Namma MedMate · Store setup
              </Text>
            </Stack>
            <Stack direction="row" align="center" gap={3}>
              <Text as="span" className="text-[11.5px] font-bold text-muted">
                Step {step + 1} of {STEPS.length}
              </Text>
              <Button type="button" variant="link" onClick={onSignOut}>
                Log out
              </Button>
            </Stack>
          </Stack>
          <Heading level={2} className="mt-2 text-[19px]">
            {STEPS[step].title}
          </Heading>
          <Text className="mt-0.5 text-[12.5px] text-muted">{STEPS[step].subtitle}</Text>
          <Stack direction="row" className="mt-[13px] gap-[5px]">
            {STEPS.map((item, index) => (
              <Box
                key={item.title}
                className={
                  index === step
                    ? "h-[5px] flex-1 rounded-[3px] bg-mid"
                    : index < step
                      ? "h-[5px] flex-1 rounded-[3px] bg-light"
                      : "h-[5px] flex-1 rounded-[3px] bg-line"
                }
              />
            ))}
          </Stack>
        </Stack>
        <Box className="min-h-0 flex-1 overflow-y-auto px-[26px] py-[22px]">
          {rejection ? (
            <Box className="mb-4 rounded-md border border-[#dc26262e] bg-rose-bg px-3.5 py-3">
              <Text className="text-[13px] font-bold text-rose">
                {stageLabel(rejection.stage)} rejected this application
              </Text>
              <Text className="text-[13px] text-ink">{rejection.comment}</Text>
            </Box>
          ) : null}
          {step === 0 ? <WelcomeStep /> : null}
          {step === 1 ? (
            <BusinessStep
              draft={draft}
              phone={phone}
              onChange={(patch) => setDraft((current) => applyPatch(current, patch))}
            />
          ) : null}
          {step === 2 ? (
            <LocationStep
              draft={draft}
              phone={phone}
              onChange={(patch) => setDraft((current) => applyPatch(current, patch))}
            />
          ) : null}
          {step === 3 ? (
            <TaxStep
              draft={draft}
              phone={phone}
              onChange={(patch) => setDraft((current) => applyPatch(current, patch))}
            />
          ) : null}
          {step === 4 ? (
            <PharmacistStep
              draft={draft}
              phone={phone}
              onChange={(patch) => setDraft((current) => applyPatch(current, patch))}
            />
          ) : null}
          {step === 5 ? (
            <InvoiceStep
              draft={draft}
              phone={phone}
              onChange={(patch) => setDraft((current) => applyPatch(current, patch))}
            />
          ) : null}
          {step === 6 ? (
            <FeaturesStep
              draft={draft}
              phone={phone}
              onChange={(patch) => setDraft((current) => applyPatch(current, patch))}
            />
          ) : null}
          {step === 7 ? (
            <ReviewStep
              draft={draft}
              phone={phone}
              onChange={(patch) => setDraft((current) => applyPatch(current, patch))}
            />
          ) : null}
          {issue ? <Text className="mt-3 text-[13px] font-bold text-rose">{issue}</Text> : null}
          {submitError ? (
            <Text className="mt-3 text-[13px] font-bold text-rose">{submitError}</Text>
          ) : null}
        </Box>
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="gap-2.5 border-t border-line px-[26px] py-[14px]"
        >
          <Button type="button" variant="ghost" disabled={step === 0 || saving} onClick={onBack}>
            Back
          </Button>
          {last ? (
            <Button type="button" size="lg" disabled={saving} onClick={() => setConfirming(true)}>
              <IconCheck size={16} /> Finish setup
            </Button>
          ) : (
            <Button type="button" onClick={onContinue}>
              {step === 0 ? "Get started" : "Continue"} <IconArrowRight size={15} />
            </Button>
          )}
        </Stack>
      </Stack>
      <Text className="mt-3.5 block px-3 pt-2 pb-3 text-center text-[10px] leading-[15px] tracking-[0.01em] text-faint">
        © 2026 Medmate India Technology Private Limited
      </Text>
      {confirming ? (
        <Box className="fixed inset-0 z-[100] grid place-items-center bg-[#10301d66] p-6">
          <Stack className="w-full max-w-[420px] gap-3 rounded-lg bg-paper p-5 shadow-pop">
            <Heading level={3}>Finish setup?</Heading>
            <Text>Your pharmacy details will be saved.</Text>
            <Stack direction="row" justify="end" gap={2}>
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={() => void finish()}>
                Finish setup
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
}
