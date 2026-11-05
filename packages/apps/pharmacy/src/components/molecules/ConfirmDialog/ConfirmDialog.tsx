import type { ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Heading } from "@/components/atoms/Heading";
import { IconAlert, IconCheck } from "@/components/atoms/Icon";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import type { ModalProps } from "@/components/molecules/Modal";
import { cn } from "@/utils/className";

export type ConfirmDialogProps = Omit<ModalProps, "children" | "footer"> & {
  body: string;
  children?: ReactNode;
  tone?: "positive" | "danger";
  mark?: ReactNode;
};

export function ConfirmDialog({
  title,
  body,
  children,
  onClose,
  tone = "danger",
  mark,
  className,
  overlayClassName,
}: ConfirmDialogProps) {
  const positive = tone === "positive";
  return (
    <Box
      data-slot="modal-overlay"
      className={cn(
        "fixed inset-0 z-[100] flex animate-[pd-fade_0.16s_ease] items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px] motion-reduce:animate-none max-[767px]:items-end max-[767px]:p-0",
        overlayClassName,
      )}
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "flex w-full max-w-[380px] animate-[pd-pop_0.2s_cubic-bezier(0.2,0.9,0.3,1.2)] flex-col overflow-hidden rounded-lg bg-paper shadow-pop motion-reduce:animate-none max-[767px]:max-h-[92dvh] max-[767px]:max-w-none max-[767px]:rounded-t-lg max-[767px]:rounded-b-none",
          className,
        )}
        onClick={stopConfirmClose}
      >
        <Stack align="center" className="gap-1.5 px-6 pt-7 pb-1 text-center">
          <Box
            aria-hidden
            className={cn(
              "mb-1.5 grid h-12 w-12 place-items-center rounded-[14px]",
              positive ? "bg-wash text-green" : "bg-rose-bg text-rose",
            )}
          >
            {mark ?? (positive ? <IconCheck size={22} /> : <IconAlert size={22} />)}
          </Box>
          <Heading level={3}>{title}</Heading>
          <Text>{body}</Text>
        </Stack>
        {children ? (
          <Stack
            direction="row"
            justify="end"
            className="gap-2.5 px-5 pt-[18px] pb-5 max-[767px]:flex-wrap max-[767px]:[&_button]:min-w-0 max-[767px]:[&_button]:flex-1"
          >
            {children}
          </Stack>
        ) : null}
      </Box>
    </Box>
  );
}

function stopConfirmClose(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}
