import type { ReactNode } from "react";
import { Heading } from "@/components/ui/Heading";
import { cn } from "@/utils/className";
import { DialogClose, useModalDialog } from "./dialog";

const dialogClass =
  "m-auto max-h-[min(92dvh,760px)] overflow-auto overscroll-contain rounded-xl border-0 bg-paper p-0 text-ink shadow-pop backdrop:overflow-hidden backdrop:bg-[rgba(13,32,21,0.5)] backdrop:backdrop-blur-[3px] backdrop:overscroll-contain";

const widths = {
  narrow: "w-[min(520px,calc(100%-2rem))]",
  wide: "w-[min(720px,calc(100%-2rem))]",
} as const;

export function ModalDialog({
  title,
  titleId,
  onClose,
  width = "narrow",
  children,
}: {
  title: string;
  titleId: string;
  onClose: () => void;
  width?: keyof typeof widths;
  children: ReactNode;
}) {
  const dialogRef = useModalDialog(onClose);
  function close() {
    const dialog = dialogRef.current;
    if (!dialog || typeof dialog.close !== "function") {
      onClose();
      return;
    }
    dialog.close();
    if (dialog.open) onClose();
  }
  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} className={cn(dialogClass, widths[width])}>
      <div aria-hidden className="h-1.5 w-full bg-mid" />
      <DialogClose.Provider value={close}>
        <div className="grid gap-4 px-5 py-5">
          <Heading id={titleId} level={3}>
            {title}
          </Heading>
          {children}
        </div>
      </DialogClose.Provider>
    </dialog>
  );
}
