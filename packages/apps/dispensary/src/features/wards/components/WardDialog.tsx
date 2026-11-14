import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { IconX } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";

export function WardDialog({
  title,
  subtitle,
  wide,
  flush,
  error,
  onClose,
  children,
  footer,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  wide?: boolean;
  flush?: boolean;
  error?: string | null;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const node = ref.current;
    if (!node || node.open) return;
    if (typeof node.showModal === "function") node.showModal();
    else node.setAttribute("open", "");
    return () => {
      if (typeof node.close === "function" && node.open) node.close();
      else node.removeAttribute("open");
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cn(
        "m-auto max-h-[90vh] w-full flex-col overflow-hidden rounded-lg border-0 bg-paper p-0 shadow-pop open:flex overscroll-contain backdrop:overflow-hidden backdrop:bg-[rgba(13,32,21,0.5)] backdrop:backdrop-blur-[3px] backdrop:overscroll-contain max-[767px]:mt-auto max-[767px]:mb-0 max-[767px]:max-h-[92dvh] max-[767px]:max-w-none max-[767px]:rounded-t-2xl max-[767px]:rounded-b-none",
        wide ? "max-w-[960px]" : "max-w-[720px]",
      )}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Stack
        direction="row"
        align="center"
        justify="between"
        className="border-b border-line px-5 py-4"
      >
        <Stack className="gap-0.5">
          <Heading id={titleId} level={3} className="text-[17px]">
            {title}
          </Heading>
          {subtitle ? (
            <Text className="text-[11px] font-semibold text-muted">{subtitle}</Text>
          ) : null}
        </Stack>
        <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
          <IconX size={18} />
        </Button>
      </Stack>
      <div className={cn("min-h-0 flex-1", flush ? "overflow-y-auto" : "overflow-y-auto p-5")}>
        {error ? (
          <Text className={cn("text-[12.5px] font-bold text-rose", flush ? "px-5 pt-4" : "mb-3")}>
            {error}
          </Text>
        ) : null}
        {children}
      </div>
      {footer ? (
        <Stack
          direction="row"
          justify="end"
          className="mt-auto gap-2.5 border-t border-line px-5 py-3.5 max-[767px]:flex-wrap max-[767px]:[&_button]:flex-1"
        >
          {footer}
        </Stack>
      ) : null}
    </dialog>
  );
}
