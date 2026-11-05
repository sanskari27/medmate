import { useEffect } from "react";
import { Button } from "@/components/atoms";
import { IconLogout } from "@/components/atoms/Icon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
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

export function SaveConfirm({ title, body, onCancel, onConfirm }: SaveConfirmProps) {
  useDismissOnEscape(onCancel);
  return (
    <ConfirmDialog title={title} body={body} onClose={onCancel} tone="positive">
      <Button variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="primary" autoFocus onClick={onConfirm}>
        Save
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
