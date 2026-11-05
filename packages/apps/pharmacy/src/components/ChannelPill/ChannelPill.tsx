import { Channel } from "@/utils";
import { IconGlobe, IconStore } from "@/components/Icon";

export function ChannelPill({ channel }: { channel: Channel }) {
  return channel === "online" ? (
    <span className="pd-pill pill-blue">
      <IconGlobe size={13} /> Online
    </span>
  ) : (
    <span className="pd-pill pill-gray">
      <IconStore size={13} /> Counter
    </span>
  );
}
