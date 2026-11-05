import type { HBarProps } from "./HBar.types";
import type { ProgressTone } from "@/components/atoms/Progress";
import { Meter } from "@/components/molecules/Meter";

function toneFor(color: string): ProgressTone {
  if (color.includes("blue")) return "blue";
  if (color.includes("gold")) return "gold";
  if (color.includes("rose")) return "rose";
  if (color.includes("amber")) return "amber";
  if (color.includes("teal")) return "teal";
  return "mid";
}

export function HBar({ label, right, pct, color }: HBarProps) {
  return <Meter className="mb-[11px]" label={label} valueLabel={right} value={Math.max(2, pct)} tone={toneFor(color)} />;
}
