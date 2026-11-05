import type { ReactNode } from "react";
import { Text } from "@/components/atoms/Text";
import { Modal, type ModalProps } from "@/components/molecules/Modal";

export type ConfirmDialogProps = Omit<ModalProps, "children" | "footer"> & {
  body: string;
  children?: ReactNode;
};

export function ConfirmDialog({ title, body, children, onClose, ...props }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose} footer={children} {...props}>
      <Text>{body}</Text>
    </Modal>
  );
}
