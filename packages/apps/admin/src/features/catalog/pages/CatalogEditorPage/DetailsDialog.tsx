import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useDialogClose } from "../../dialog";
import { ModalDialog } from "../../modal";

function DetailsBody({ children }: { children: ReactNode }) {
  const close = useDialogClose();
  return (
    <>
      <Text variant="muted">Quantity, storage, origin, and the longer descriptions.</Text>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      <Stack direction="row" justify="end">
        <Button type="button" onClick={close}>
          Done
        </Button>
      </Stack>
    </>
  );
}

export function DetailsDialog({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const titleId = useId();
  return (
    <ModalDialog title="Product details" titleId={titleId} width="wide" onClose={onClose}>
      <DetailsBody>{children}</DetailsBody>
    </ModalDialog>
  );
}
