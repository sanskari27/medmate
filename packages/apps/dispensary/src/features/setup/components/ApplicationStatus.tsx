import { Box } from "@/components/ui/Box";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import type { VerificationStatus } from "@/types";

const COMPLIANCE_SENTENCE = "Compliance is reviewing this application.";
const ADMIN_SENTENCE = "Admin is doing the final review.";

type StageState = "Done" | "In review" | "Waiting";

type Stage = {
  title: string;
  state: StageState;
  detail: string;
};

function stagesFor(status: VerificationStatus | null): Stage[] {
  const admin = status === "pending_admin";
  return [
    { title: "Submitted", state: "Done", detail: "We have your application." },
    {
      title: "Compliance review",
      state: admin ? "Done" : "In review",
      detail: admin ? "Compliance approved this application." : COMPLIANCE_SENTENCE,
    },
    {
      title: "Admin review",
      state: admin ? "In review" : "Waiting",
      detail: admin ? ADMIN_SENTENCE : "Admin review starts after compliance.",
    },
  ];
}

function markerClass(state: StageState) {
  if (state === "Waiting") return "bg-line-2";
  if (state === "In review") return "bg-mid ring-4 ring-wash";
  return "bg-light";
}

export function ApplicationStatus({ status }: { status: VerificationStatus | null }) {
  const admin = status === "pending_admin";
  const completed = admin ? 2 : 1;
  return (
    <Stack className="gap-4">
      <Stack className="gap-1">
        <Heading level={2}>Your application is under review</Heading>
        <Text className="text-[13px] text-muted">
          {admin ? ADMIN_SENTENCE : COMPLIANCE_SENTENCE}
        </Text>
      </Stack>
      <Box
        role="progressbar"
        aria-label="Application review"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={completed}
        className="h-[7px] overflow-hidden rounded-[5px] bg-wash"
      >
        <Box
          className={
            admin
              ? "h-full w-2/3 rounded-[inherit] bg-mid"
              : "h-full w-1/3 rounded-[inherit] bg-mid"
          }
        />
      </Box>
      <Stack role="list" className="gap-3">
        {stagesFor(status).map((stage) => (
          <Stack key={stage.title} role="listitem" direction="row" align="start" gap={3}>
            <Box className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${markerClass(stage.state)}`} />
            <Stack className="min-w-0 flex-1 gap-0.5">
              <Stack direction="row" align="center" justify="between" gap={3}>
                <Text as="span" className="text-[13.5px] font-bold text-ink">
                  {stage.title}
                </Text>
                <Text as="span" variant="caption" className="shrink-0 font-bold">
                  {stage.state}
                </Text>
              </Stack>
              <Text variant="muted">{stage.detail}</Text>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
