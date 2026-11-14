import { createContext, useContext, useEffect, useRef } from "react";

const DialogClose = createContext<() => void>(() => {});

export function useDialogClose() {
  return useContext(DialogClose);
}

export { DialogClose };

function supportsClosedBy() {
  return typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype;
}

function pointerOutside(event: PointerEvent, dialog: HTMLDialogElement) {
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

export function useModalDialog(onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const node: HTMLDialogElement = dialog;
    let active = true;
    let pressedOutside = false;

    function onDialogClose() {
      if (active) onCloseRef.current();
    }
    function onPointerDown(event: PointerEvent) {
      pressedOutside = pointerOutside(event, node);
    }
    function onPointerUp(event: PointerEvent) {
      if (pressedOutside && pointerOutside(event, node) && typeof node.close === "function") {
        node.close();
      }
    }

    node.addEventListener("close", onDialogClose);
    const openDialog = window.setTimeout(() => {
      if (!active || node.open) return;
      node.setAttribute("closedby", "any");
      try {
        node.showModal();
      } catch {
        node.setAttribute("open", "");
      }
      if (!supportsClosedBy()) {
        node.addEventListener("pointerdown", onPointerDown);
        node.addEventListener("pointerup", onPointerUp);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(openDialog);
      node.removeEventListener("close", onDialogClose);
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return dialogRef;
}
