import { Box } from "@/components/atoms/Box";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { IconCheck } from "@/components/atoms/Icon";
import { ONLINE_FLOW, STATUS_LABEL, type OrderStatus } from "@/utils";
import { cn } from "@/utils/className";
import type { OrderTimelineProps } from "./OrderTimeline.types";

export function OrderTimeline({ status }: OrderTimelineProps) {
  const index = ONLINE_FLOW.indexOf(status);
  function renderStep(step: OrderStatus, position: number) {
    return <TimelineStep key={step} step={step} position={position} index={index} />;
  }
  return (
    <Stack direction="row" align="center" justify="between" className="my-1 mb-[18px] gap-0 print:hidden">
      {ONLINE_FLOW.map(renderStep)}
    </Stack>
  );
}

function TimelineStep({ step, position, index }: { step: OrderStatus; position: number; index: number }) {
  const reached = position <= index;
  return (
    <Box className="relative flex-1 text-center">
      {position > 0 ? (
        <Box className={cn("absolute top-[11px] -left-1/2 h-[3px] w-full", position <= index ? "bg-mid" : "bg-line")} />
      ) : null}
      <Box
        className={cn(
          "relative mx-auto grid h-6 w-6 place-items-center rounded-full text-[12px] font-extrabold text-white",
          reached ? "bg-mid" : "bg-line",
        )}
      >
        {position < index ? <IconCheck size={12} /> : position + 1}
      </Box>
      <Text as="span" className={cn("mt-[5px] block text-[10.5px] font-bold", reached ? "text-dark" : "text-muted")}>
        {STATUS_LABEL[step]}
      </Text>
    </Box>
  );
}
