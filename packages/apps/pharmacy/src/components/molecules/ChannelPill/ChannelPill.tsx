import { Pill } from "@/components/atoms/Pill";
import { IconGlobe, IconStore } from "@/components/atoms/Icon";
import type { Channel } from "@/utils";

export function ChannelPill({ channel }: { channel: Channel }) {
  if (channel === "online") {
    return (
      <Pill tone="blue">
        <IconGlobe size={13} /> Online
      </Pill>
    );
  }
  return (
    <Pill tone="gray">
      <IconStore size={13} /> Counter
    </Pill>
  );
}
