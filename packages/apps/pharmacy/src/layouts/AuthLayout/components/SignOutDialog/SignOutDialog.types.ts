export type SignOutDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

import type { ConfirmTone } from "@/components/molecules/ConfirmDialog";

export type SaveConfirmProps = {
  title: string;
  body: string;
  tone?: ConfirmTone;
  confirm?: string;
  onCancel: () => void;
  onConfirm: () => void;
};
