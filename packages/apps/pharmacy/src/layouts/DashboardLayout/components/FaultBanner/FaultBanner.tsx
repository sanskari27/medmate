import { useEffect } from "react";
import { IconButton, Stack, Text } from "@/components/atoms";
import { Alert } from "@/components/molecules/Alert";
import { usePharma } from "@/hooks";

export function FaultBanner() {
  const { formFault, clearFault } = usePharma();
  useEffect(
    function scrollFaultIntoView() {
      if (!formFault?.field) return;
      document.querySelector(`[data-field="${formFault.field}"]`)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    },
    [formFault],
  );
  if (!formFault) return null;
  return (
    <Alert
      role="alert"
      tone="rose"
      className="fixed top-4 left-1/2 z-[300] w-[min(480px,calc(100%-2rem))] -translate-x-1/2 shadow-card"
    >
      <Stack direction="row" align="start" justify="between" gap={2}>
        <Text className="font-bold text-rose">{formFault.message}</Text>
        <IconButton label="Dismiss error" variant="close" onClick={clearFault}>
          ×
        </IconButton>
      </Stack>
    </Alert>
  );
}
