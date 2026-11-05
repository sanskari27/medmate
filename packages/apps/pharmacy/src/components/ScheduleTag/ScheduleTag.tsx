import { Schedule, SCHEDULE_META } from "@/utils";

export function ScheduleTag({ schedule }: { schedule: Schedule }) {
  const m = SCHEDULE_META[schedule];
  return (
    <span className={`pd-tag ${m.rx ? "rx" : "otc"}`} title={m.note}>
      {m.label}
    </span>
  );
}
