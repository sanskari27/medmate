import { useEffect } from "react";
import { IconButton, Text } from "@/components/atoms";
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
      className="fixed top-4 left-1/2 z-[300] flex w-[min(480px,calc(100%-2rem))] -translate-x-1/2 items-start gap-2.5 rounded-md px-3.5 py-3 text-[13.5px] font-bold shadow-pop"
    >
      <Text className="text-[13.5px] font-bold text-rose">{formFault.message}</Text>
      <IconButton
        label="Dismiss error"
        variant="close"
        onClick={clearFault}
        className="ml-auto h-auto w-auto px-0.5 py-0 text-[18px] leading-none text-rose hover:text-rose"
      >
        ×
      </IconButton>
    </Alert>
  );
}
