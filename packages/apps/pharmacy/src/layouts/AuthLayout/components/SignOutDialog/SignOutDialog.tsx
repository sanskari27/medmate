import { useEffect } from "react";
import { Button } from "@/components/atoms";
import { IconLogout } from "@/components/atoms/Icon";
import { ConfirmDialog, type ConfirmTone } from "@/components/molecules/ConfirmDialog";
import type { ButtonVariant } from "@/components/atoms/Button";
import type { SaveConfirmProps, SignOutDialogProps } from "./SignOutDialog.types";

export function SignOutDialog({ onCancel, onConfirm }: SignOutDialogProps) {
  useDismissOnEscape(onCancel);
  return (
    <ConfirmDialog
      title="Log out"
      body="You will leave this session. Sign in again to continue."
      onClose={onCancel}
      size="sm"
      mark={<IconLogout size={22} />}
    >
      <Button variant="ghost" autoFocus onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="rose" onClick={onConfirm}>
        Log out
      </Button>
    </ConfirmDialog>
  );
}

const confirmVariant: Record<ConfirmTone, ButtonVariant> = {
  positive: "primary",
  caution: "gold",
  danger: "rose",
  info: "primary",
};

const infoButton = "!border-blue !bg-blue !text-white hover:!bg-[#1d4ed8]";

export function SaveConfirm({
  title,
  body,
  tone = "positive",
  confirm = "Save",
  onCancel,
  onConfirm,
}: SaveConfirmProps) {
  useDismissOnEscape(onCancel);
  return (
    <ConfirmDialog title={title} body={body} onClose={onCancel} tone={tone}>
      <Button variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        variant={confirmVariant[tone]}
        className={tone === "info" ? infoButton : undefined}
        autoFocus
        onClick={onConfirm}
      >
        {confirm}
      </Button>
    </ConfirmDialog>
  );
}

function useDismissOnEscape(onCancel: () => void) {
  useEffect(
    function listenForEscape() {
      function onKey(event: KeyboardEvent) {
        if (event.key === "Escape") onCancel();
      }
      window.addEventListener("keydown", onKey);
      return function removeEscapeListener() {
        window.removeEventListener("keydown", onKey);
      };
    },
    [onCancel],
  );
}
