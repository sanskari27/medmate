import { Tag } from "@/components/atoms/Tag";
import { SCHEDULE_META, type Schedule } from "@/utils";

export function ScheduleTag({ schedule }: { schedule: Schedule }) {
  const meta = SCHEDULE_META[schedule];
  return (
    <Tag tone={meta.rx ? "rx" : "otc"} title={meta.note}>
      {meta.label}
    </Tag>
  );
}
