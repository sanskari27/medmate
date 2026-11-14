import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, type ConfirmTone } from "@/components/ui/ConfirmDialog";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Switch } from "@/components/ui/Switch";
import { Text } from "@/components/ui/Text";
import { useAuthState } from "@/features/authentication";
import { DocumentPreview } from "../../components/DocumentPreview";
import { FieldSections } from "../../components/FieldSections";
import { PharmacyActivity } from "../../components/PharmacyActivity";
import { useFilePreview } from "../../hooks/useFilePreview";
import {
  blockLabel,
  decisionName,
  formatWhen,
  missingSlots,
  ownerSections,
  slotLabel,
  stageName,
  textValue,
} from "../../ownerModel";
import { problemMessage } from "../../problemMessage";
import {
  useBlockOwnerMutation,
  useDecideBlockMutation,
  useOwnerDetailQuery,
  useRequestBlockMutation,
  useUnblockOwnerMutation,
} from "../../services/pharmacies.api";
import type { OwnerDetail, OwnerDocument } from "../../types";

function DocumentPanel({
  documents,
  selected,
  onSelect,
}: {
  documents: OwnerDocument[];
  selected: OwnerDocument | null;
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

type BlockAction = "request" | "approve" | "reject" | "block" | "unblock";

const blockPrompt: Record<
  BlockAction,
  { title: string; body: string; confirm: string; tone: ConfirmTone }
> = {
  request: {
    title: "Request a block?",
    body: "Admin still has to approve this request.",
    confirm: "Request block",
    tone: "caution",
  },
  approve: {
    title: "Approve this block?",
    body: "The owner is restricted and pharmacy staff cannot sign in.",
    confirm: "Approve block",
    tone: "danger",
  },
  reject: {
    title: "Reject this request?",
    body: "The owner stays active.",
    confirm: "Reject request",
    tone: "caution",
  },
  block: {
    title: "Block this account?",
    body: "The owner is restricted and pharmacy staff cannot sign in.",
    confirm: "Block account",
    tone: "danger",
  },
  unblock: {
    title: "Unblock this account?",
    body: "The owner and pharmacy staff can sign in again.",
    confirm: "Unblock account",
    tone: "positive",
  },
};

function BlockPanel({
  detail,
  onChange,
}: {
  detail: OwnerDetail;
  onChange: (next: OwnerDetail) => void;
}) {
  const account = useAuthState().session?.account;
  const admin = account?.accountType === "admin";
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<BlockAction | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [requestBlock, requestState] = useRequestBlockMutation();
  const [decideBlock, decideState] = useDecideBlockMutation();
  const [blockOwner, blockState] = useBlockOwnerMutation();
  const [unblockOwner, unblockState] = useUnblockOwnerMutation();
  const busy =
    requestState.isLoading ||
    decideState.isLoading ||
    blockState.isLoading ||
    unblockState.isLoading;
  const prompt = pending ? blockPrompt[pending] : null;
  const toggleBlocked = detail.blockState === "blocked";

  function ask(action: BlockAction) {
    if (busy) return;
    setFailure(null);
    setPending(action);
  }

  function dismiss() {
    if (busy) return;
    setPending(null);
    setFailure(null);
  }

  async function confirm() {
    if (!pending) return;
    setFailure(null);
    try {
      const next = await run(pending);
      onChange(next);
      setPending(null);
    } catch (error) {
      setFailure(problemMessage(error, "Could not update this block"));
    }
  }

  function run(action: BlockAction) {
    if (action === "request") {
      return requestBlock({ id: detail.pharmacyId, reason: reason.trim() }).unwrap();
    }
    if (action === "approve" || action === "reject") {
      return decideBlock({
        id: detail.pharmacyId,
        requestId: detail.request?.id ?? "",
        decision: action === "approve" ? "approve" : "reject",
      }).unwrap();
    }
    if (action === "block") return blockOwner(detail.pharmacyId).unwrap();
    return unblockOwner(detail.pharmacyId).unwrap();
  }

  return (
    <section className="rounded-lg border border-line bg-paper px-4 py-4">
      <Heading level={3} className="text-[15px]">
        Block
      </Heading>
      {admin && detail.blockState !== "requested" ? (
        <Stack direction="row" align="center" justify="between" className="mt-3">
          <Text className="text-[13.5px] font-bold">{toggleBlocked ? "Blocked" : "Active"}</Text>
          <Switch
            checked={toggleBlocked}
            label={toggleBlocked ? "Unblock account" : "Block account"}
            disabled={busy}
            onClick={() => ask(toggleBlocked ? "unblock" : "block")}
          />
        </Stack>
      ) : (
        <Text className="mt-3 text-[13.5px] font-bold">{blockLabel(detail.blockState)}</Text>
      )}
      {detail.request ? (
        <Stack className="mt-2 gap-1">
          <Text className="text-[13.5px]">{detail.request.reason}</Text>
          <Text className="text-[13.5px] text-muted">
            Requested{" "}
            <time dateTime={detail.request.requestedAt}>
              {formatWhen(detail.request.requestedAt)}
            </time>
          </Text>
        </Stack>
      ) : null}
      {!admin && detail.blockState === "requested" ? (
        <Text className="mt-2 text-[13.5px] text-muted">Waiting for admin review.</Text>
      ) : null}
      {!admin && detail.blockState === "blocked" ? (
        <Text className="mt-2 text-[13.5px]">Blocked.</Text>
      ) : null}
      {!admin && detail.blockState === "clear" ? (
        <Stack className="mt-3 gap-2">
          <label className="grid gap-1">
            <Text as="span" variant="label">
              Reason
            </Text>
            <Input
              aria-label="Reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <Button
            type="button"
            disabled={reason.trim().length === 0 || busy}
            onClick={() => ask("request")}
          >
            Request block
          </Button>
        </Stack>
      ) : null}
      {admin && detail.blockState === "requested" && detail.request ? (
        <Stack direction="row" className="mt-3 gap-2">
          <Button type="button" disabled={busy} onClick={() => ask("approve")}>
            Approve block
          </Button>
          <Button type="button" variant="rose" disabled={busy} onClick={() => ask("reject")}>
            Reject request
          </Button>
        </Stack>
      ) : null}
      {prompt ? (
        <ConfirmDialog
          title={prompt.title}
          body={prompt.body}
          tone={prompt.tone}
          busy={busy}
          error={failure}
          onClose={dismiss}
        >
          <Button type="button" variant="ghost" disabled={busy} onClick={dismiss}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={
              prompt.tone === "danger" ? "rose" : prompt.tone === "caution" ? "gold" : "primary"
            }
            disabled={busy}
            onClick={() => void confirm()}
          >
            {prompt.confirm}
          </Button>
        </ConfirmDialog>
      ) : null}
    </section>
  );
}

export function PharmacyDetailPage() {
  const { pharmacyId = "" } = useParams();
  const detail = useOwnerDetailQuery(pharmacyId, { skip: pharmacyId.length === 0 });
  const [override, setOverride] = useState<OwnerDetail | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const application = override ?? detail.data;
  const documents = application?.documents ?? [];
  const selected = documents.find((document) => document.slot === slot) ?? documents[0] ?? null;

  if (detail.isLoading && !application) {
    return <Text className="text-[13.5px] text-muted">Loading pharmacy</Text>;
  }
  if ((detail.isError && !application) || !application) {
    return (
      <Text className="text-[13.5px] font-bold text-rose">
        {problemMessage(detail.error, "Could not open this pharmacy")}
      </Text>
    );
  }

  return (
    <Stack className="gap-4">
      <Stack className="gap-2">
        <Button variant="link" asChild className="w-fit text-[13px]">
          <Link to="/pharmacies">All pharmacies</Link>
        </Button>
        <Heading level={2} className="text-[24px]">
          {textValue(application.name)}
        </Heading>
      </Stack>
      <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <FieldSections sections={ownerSections(application)} />
        <Stack className="gap-4">
          <DocumentPanel documents={documents} selected={selected} onSelect={setSlot} />
          <BlockPanel detail={application} onChange={setOverride} />
          <History detail={application} />
        </Stack>
      </div>
      <PharmacyActivity pharmacyId={application.pharmacyId} />
    </Stack>
  );
}

function History({ detail }: { detail: OwnerDetail }) {
  const missing = missingSlots(detail.documents ?? []);
  const reviews = detail.reviews ?? [];
  const blocks = detail.blockHistory ?? [];
  return (
    <Stack className="gap-4">
      <section className="rounded-lg border border-line bg-paper px-4 py-4">
        <Heading level={3} className="text-[15px]">
          Missing documents
        </Heading>
        {missing.length === 0 ? (
          <Text className="mt-3 text-[13.5px] text-muted">Every document slot is stored.</Text>
        ) : (
          <Text className="mt-3 text-[13.5px]">{missing.map(slotLabel).join(", ")}</Text>
        )}
      </section>
      <section className="rounded-lg border border-line bg-paper px-4 py-4">
        <Heading level={3} className="text-[15px]">
          Review history
        </Heading>
        {reviews.length === 0 ? (
          <Text className="mt-3 text-[13.5px] text-muted">No review decisions.</Text>
        ) : (
          <ul className="mt-3 grid gap-3">
            {reviews.map((review) => (
              <li key={`${review.at}-${review.stage}`}>
                <Text className="text-[13.5px] font-bold">
                  {stageName(review.stage)} · {decisionName(review.decision)}
                </Text>
                <Text className="text-[13.5px] text-muted">
                  {textValue(review.actor)} ·{" "}
                  <time dateTime={review.at}>{formatWhen(review.at)}</time>
                </Text>
                {review.comment ? <Text className="text-[13.5px]">{review.comment}</Text> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-lg border border-line bg-paper px-4 py-4">
        <Heading level={3} className="text-[15px]">
          Block history
        </Heading>
        {blocks.length === 0 ? (
          <Text className="mt-3 text-[13.5px] text-muted">No closed block requests.</Text>
        ) : (
          <ul className="mt-3 grid gap-3">
            {blocks.map((block) => (
              <li key={`${block.requestedAt}-${block.reason}`}>
                <Text className="text-[13.5px] font-bold">
                  {decisionName(block.status)} · {block.reason}
                </Text>
                <Text className="text-[13.5px] text-muted">
                  Requested by {textValue(block.requestedBy)} ·{" "}
                  <time dateTime={block.requestedAt}>{formatWhen(block.requestedAt)}</time>
                </Text>
                <Text className="text-[13.5px] text-muted">
                  Decided by {textValue(block.decidedBy)}
                  {block.decidedAt ? (
                    <>
                      {" "}
                      · <time dateTime={block.decidedAt}>{formatWhen(block.decidedAt)}</time>
                    </>
                  ) : null}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Stack>
  );
}
