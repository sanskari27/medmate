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
};

export function ConfirmDialog({
  title,
  body,
  children,
  onClose,
  tone = "danger",
  className,
  overlayClassName,
}: ConfirmDialogProps) {
  const positive = tone === "positive";
  return (
    <Box
      data-slot="modal-overlay"
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]",
        overlayClassName,
      )}
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "flex w-full max-w-[380px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop",
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
            {positive ? <IconCheck size={22} /> : <IconAlert size={22} />}
          </Box>
          <Heading level={3} className="text-[18px]">
            {title}
          </Heading>
          <Text className="max-w-[32ch] text-[13.5px] [line-height:1.45] text-muted">{body}</Text>
        </Stack>
        {children ? (
          <Stack direction="row" justify="end" className="gap-2.5 px-5 pt-[18px] pb-5">
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
