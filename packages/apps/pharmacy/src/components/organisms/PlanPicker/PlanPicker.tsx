import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { Pill } from "@/components/atoms/Pill";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { IconCheck, IconStar } from "@/components/atoms/Icon";
import { annualOff, annualPerMonth, annualSavings, cycleNoun, inr, planPrice, PLANS } from "@/utils";
import { cn } from "@/utils/className";
import type { PlanCardProps, PlanPickerProps } from "./PlanPicker.types";

function PlanFeature({ feature }: { feature: string }) {
  return (
    <Stack direction="row" align="start" gap={2} className="py-0.5">
      <Box className="mt-0.5 shrink-0 text-green">
        <IconCheck size={13} />
      </Box>
      <Text as="span" className="text-[12.5px]">
        {feature}
      </Text>
    </Stack>
  );
}

function PlanFeatures({ features }: { features: string[] }) {
  function renderFeature(feature: string) {
    return <PlanFeature key={feature} feature={feature} />;
  }
  return features.map(renderFeature);
}

export function PlanCard({ plan, cycle, current, onRequest, className }: PlanCardProps) {
  const free = plan.key === "Essential";
  const price = planPrice(plan, cycle);
  function onChoose() {
    onRequest(plan.key, free ? "monthly" : cycle, current ? "renewal" : "plan");
  }
  return (
    <Stack
      data-slot="plan-card"
      gap={1}
      className={cn(
        "relative h-full rounded-lg border border-line bg-paper p-4 shadow-card",
        current && "border-2 border-mid",
        className,
      )}
    >
      {plan.key === "Growth" ? (
        <Pill tone="gold" className="absolute -top-2.5 right-3.5">
          <IconStar size={13} /> Popular
        </Pill>
      ) : null}
      {free ? (
        <Pill tone="green" className="absolute -top-2.5 right-3.5">
          <IconCheck size={12} /> Free forever
        </Pill>
      ) : null}
      <Heading level={3} className="text-[18px]">
        {plan.name}
      </Heading>
      <Text variant="caption">{plan.tagline}</Text>
      <Stack direction="row" align="end" gap={1} className="mt-2">
        <Heading level={2} className="text-[28px]">
          {free ? "₹0" : inr(price)}
        </Heading>
        {free ? null : (
          <Text as="span" variant="muted">
            /{cycleNoun(cycle)}
          </Text>
        )}
      </Stack>
      {free ? (
        <Text variant="caption" className="mb-3">
          no card · no expiry
        </Text>
      ) : cycle === "annual" ? (
        <Text as="span" variant="caption" className="mb-3">
          <Pill tone="green">{annualOff(plan)}% off</Pill> {inr(annualPerMonth(plan))}/mo · save{" "}
          {inr(annualSavings(plan))}
        </Text>
      ) : (
        <Text variant="caption" className="mb-3">
          or {inr(annualPerMonth(plan))}/mo billed yearly (save {annualOff(plan)}%)
        </Text>
      )}
      <Stack gap={1} className="mb-3 flex-1">
        <PlanFeatures features={plan.features} />
      </Stack>
      <Button variant="ghost" block disabled={Boolean(current && free)} onClick={onChoose} className="mt-auto">
        {current && free ? "Current plan" : current ? "Request renewal" : `Request ${plan.name}`}
      </Button>
    </Stack>
  );
}

export function PlanPicker({
  plans = PLANS,
  cycle,
  currentPlan,
  currentCycle,
  onRequest,
  className,
}: PlanPickerProps) {
  function renderPlan(plan: PlanCardProps["plan"]) {
        const current = plan.key === currentPlan && (plan.key === "Essential" || cycle === currentCycle);
        return <PlanCard key={plan.key} plan={plan} cycle={cycle} current={current} onRequest={onRequest} />;
      }
  return (
    <Box
      data-slot="plan-picker"
      className={cn("grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3.5 pt-3", className)}
    >
      {plans.map(renderPlan)}
    </Box>
  );
}
