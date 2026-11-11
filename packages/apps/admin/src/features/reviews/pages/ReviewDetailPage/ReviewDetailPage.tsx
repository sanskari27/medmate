import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useAuthState } from "@/features/authentication";
import { DecisionBar } from "../../components/DecisionBar";
import { DocumentPreview } from "../../components/DocumentPreview";
import { FieldSections } from "../../components/FieldSections";
import { useFilePreview } from "../../hooks/useFilePreview";
import { problemMessage } from "../../problemMessage";
import { applicationSections, decisionNote, decisionRoute, slotLabel } from "../../reviewModel";
import { useApplicationDetailQuery, useDecideMutation } from "../../services/reviews.api";
import type { ApplicationDocument } from "../../types";

function DocumentPanel({
  documents,
  selected,
  onSelect,
}: {
  documents: ApplicationDocument[];
  selected: ApplicationDocument | null;
  onSelect: (slot: string) => void;
}) {
  const preview = useFilePreview(selected);
  const label = selected ? slotLabel(selected.slot) : "";
  return (
    <section className="rounded-lg border border-line bg-paper px-4 py-4">
      <Heading level={3} className="text-[15px]">
        Documents
      </Heading>
      {documents.length === 0 ? (
        <Text className="mt-3 text-[13.5px] text-muted">No documents were stored.</Text>
      ) : (
        <Stack className="mt-3 gap-3">
          <div className="flex flex-wrap gap-2">
            {documents.map((document) => {
              const active = selected?.slot === document.slot;
              return (
                <Button
                  key={document.slot}
                  variant={active ? "primary" : "line"}
                  size="sm"
                  aria-pressed={active}
                  onClick={() => onSelect(document.slot)}
                >
                  {slotLabel(document.slot)}
                </Button>
              );
            })}
          </div>
          {selected ? (
            <DocumentPreview
              label={label}
              contentType={selected.contentType}
              src={preview.src}
              error={preview.error}
              loading={preview.loading}
            />
          ) : null}
        </Stack>
      )}
    </section>
  );
}

export function ReviewDetailPage() {
  const { pharmacyId = "" } = useParams();
  const navigate = useNavigate();
  const account = useAuthState().session?.account ?? null;
  const detail = useApplicationDetailQuery(pharmacyId, { skip: pharmacyId.length === 0 });
  const [decide, decision] = useDecideMutation();
  const [failure, setFailure] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const application = detail.data;
  const documents = application?.documents ?? [];
  const selected = documents.find((document) => document.slot === slot) ?? documents[0] ?? null;

  async function approve() {
    if (!account || !application) return;
    const route = decisionRoute(account, application.status);
    if (!route) return;
    setFailure(null);
    try {
      await decide({ id: application.pharmacyId, route, body: { decision: "approve" } }).unwrap();
      navigate("/reviews");
    } catch (error) {
      setFailure(problemMessage(error, "Could not save this decision"));
    }
  }

  async function reject(comment: string) {
    if (!account || !application) return;
    const route = decisionRoute(account, application.status);
    if (!route) return;
    setFailure(null);
    try {
      await decide({
        id: application.pharmacyId,
        route,
        body: { decision: "reject", comment },
      }).unwrap();
      navigate("/reviews");
    } catch (error) {
      setFailure(problemMessage(error, "Could not save this decision"));
    }
  }

  if (detail.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading application</Text>;
  }
  if (detail.isError || !application) {
    return (
      <Text className="text-[13.5px] font-bold text-rose">
        {problemMessage(detail.error, "Could not open this application")}
      </Text>
    );
  }

  const note = account
    ? decisionNote(account, application.status)
    : "This application is not waiting for review.";

  return (
    <Stack className="gap-4">
      <Stack className="gap-2">
        <Button variant="link" asChild className="w-fit text-[13px]">
          <Link to="/reviews">All applications</Link>
        </Button>
        <Heading level={2} className="text-[24px]">
          {application.name?.trim() || "Application"}
        </Heading>
      </Stack>
      <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <FieldSections sections={applicationSections(application)} />
        <Stack className="gap-4">
          <DocumentPanel documents={documents} selected={selected} onSelect={setSlot} />
          <DecisionBar
            note={note}
            busy={decision.isLoading}
            error={failure}
            onApprove={() => void approve()}
            onReject={(comment) => void reject(comment)}
          />
        </Stack>
      </div>
    </Stack>
  );
}
