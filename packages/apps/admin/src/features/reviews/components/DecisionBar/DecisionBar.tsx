import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";

const COMMENT_LIMIT = 2000;

export function DecisionBar({
  note,
  busy,
  error,
  onApprove,
  onReject,
}: {
  note: string | null;
  busy: boolean;
  error: string | null;
  onApprove: () => void;
  onReject: (comment: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null);
  const shown = localError ?? (confirming ? null : error);

  function submitReject() {
    const trimmed = comment.trim();
    if (!trimmed) {
      setLocalError("A comment is required.");
      return;
    }
    if (trimmed.length > COMMENT_LIMIT) {
      setLocalError("Comment is too long.");
      return;
    }
    setLocalError(null);
    setConfirming("reject");
  }

  function dismiss() {
    if (busy) return;
    setConfirming(null);
  }

  return (
    <Stack className="gap-3 rounded-lg border border-line bg-paper px-4 py-4">
      {note ? <Text className="text-[13.5px] text-ink">{note}</Text> : null}
      {shown ? <Text className="text-[13px] font-bold text-rose">{shown}</Text> : null}
      {note ? null : (
        <Stack className="gap-3">
          {open ? (
            <Field label="Rejection comment" htmlFor="rejection-comment">
              <textarea
                id="rejection-comment"
                value={comment}
                onChange={(event) => {
                  setComment(event.target.value);
                  setLocalError(null);
                }}
                rows={4}
                className="w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus"
              />
            </Field>
          ) : null}
          <Stack direction="row" className="gap-2">
            <Button variant="primary" disabled={busy} onClick={() => setConfirming("approve")}>
              Approve
            </Button>
            {open ? (
              <Button variant="rose" disabled={busy} onClick={submitReject}>
                Reject application
              </Button>
            ) : (
              <Button variant="rose" disabled={busy} onClick={() => setOpen(true)}>
                Reject
              </Button>
            )}
          </Stack>
        </Stack>
      )}
      {confirming ? (
        <ConfirmDialog
          title={
            confirming === "approve" ? "Approve this application?" : "Reject this application?"
          }
          body={
            confirming === "approve"
              ? "This records the decision for this stage."
              : "The owner can update the application and submit it again."
          }
          tone={confirming === "approve" ? "positive" : "danger"}
          busy={busy}
          error={error}
          onClose={dismiss}
        >
          <Button type="button" variant="ghost" disabled={busy} onClick={dismiss}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirming === "approve" ? "primary" : "rose"}
            disabled={busy}
            onClick={() => {
              if (confirming === "approve") onApprove();
              else onReject(comment.trim());
            }}
          >
            {confirming === "approve" ? "Approve" : "Reject application"}
          </Button>
        </ConfirmDialog>
      ) : null}
    </Stack>
  );
}
