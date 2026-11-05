import { todayISO } from "@/domain";

export function plusDays(days: number) {
  const date = new Date(todayISO() + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
