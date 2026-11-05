import { Box } from "@/components/atoms/Box";
import { Text } from "@/components/atoms/Text";
import { usePharma } from "@/hooks";
import { cn } from "@/utils/className";
import type { ToastProps } from "./Toast.types";

export function Toast({ className }: ToastProps) {
  const { toastMsg } = usePharma();
  return (
    <Box
      data-slot="toast"
      role="status"
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 translate-y-5 rounded-md bg-deep px-5 py-3 text-white opacity-0 shadow-pop transition",
        toastMsg ? "translate-y-0 opacity-100" : "",
        className,
      )}
    >
      <Text as="span" className="text-[13.5px] font-semibold text-white">
        {toastMsg}
      </Text>
    </Box>
  );
}
