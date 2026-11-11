import { useEffect, type ReactNode } from "react";
import { Box } from "@/components/ui/Box";
import { Heading } from "@/components/ui/Heading";
import { IconCheck } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";

export type ConfirmTone = "positive" | "caution" | "danger" | "info";

const toneStyle: Record<ConfirmTone, { well: string; bar: string; mark: ReactNode }> = {
  positive: { well: "bg-wash text-green", bar: "bg-green", mark: <IconCheck size={22} /> },
  caution: { well: "bg-amber-bg text-gold-d", bar: "bg-gold", mark: <EditMark /> },
  danger: { well: "bg-rose-bg text-rose", bar: "bg-rose", mark: <AlertMark /> },
  info: { well: "bg-blue-bg text-blue", bar: "bg-blue", mark: <InfoMark /> },
};

export type ConfirmDialogProps = {
  title: string;
  body: string;
  children?: ReactNode;
  onClose: () => void;
  tone?: ConfirmTone;
  busy?: boolean;
  error?: string | null;
  className?: string;
};

export function ConfirmDialog({
  title,
  body,
  children,
  onClose,
  tone = "danger",
  busy = false,
  error,
  className,
}: ConfirmDialogProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const style = toneStyle[tone];
  return (
    <Box
      data-slot="modal-overlay"
      className="fixed inset-0 z-[100] flex animate-[pd-fade_0.16s_ease] items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px] motion-reduce:animate-none max-[767px]:items-end max-[767px]:p-0"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-tone={tone}
        className={cn(
          "flex w-full max-w-[380px] animate-[pd-pop_0.2s_cubic-bezier(0.2,0.9,0.3,1.2)] flex-col overflow-hidden rounded-lg bg-paper shadow-pop motion-reduce:animate-none max-[767px]:max-h-[92dvh] max-[767px]:max-w-none max-[767px]:rounded-t-lg max-[767px]:rounded-b-none",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <Box aria-hidden className={cn("h-1.5 w-full", style.bar)} />
        <Stack align="center" className="gap-1.5 px-6 pt-6 pb-1 text-center">
          <Box
            aria-hidden
            className={cn("mb-1.5 grid h-12 w-12 place-items-center rounded-[14px]", style.well)}
          >
            {style.mark}
          </Box>
          <Heading level={3}>{title}</Heading>
          <Text>{body}</Text>
        </Stack>
        {error ? (
          <Text className="px-6 pt-3 text-center text-[13px] font-bold text-rose">{error}</Text>
        ) : null}
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

function AlertMark() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 4.8 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function EditMark() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function InfoMark() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 8h.01" />
    </svg>
  );
}
