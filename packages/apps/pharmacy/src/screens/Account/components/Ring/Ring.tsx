import type { RingProps } from "./Ring.types";
import { Box, Text } from "@/components/atoms";
import { RingMark } from "@/components/organisms/DonutChart";
export function Ring({ pct }: RingProps) {
    return (<Box className="!relative !grid !h-[78px] !w-[78px] !place-items-center">
      <RingMark pct={pct} />
      <Text className="!text-[13px] !font-extrabold" as="span">{pct}%</Text>
    </Box>);
}
