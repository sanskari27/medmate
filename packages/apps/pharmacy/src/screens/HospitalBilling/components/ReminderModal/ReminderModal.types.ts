import type { hospitalAging } from "@/utils/calculations/hospitalAccount";

export type ReminderModalProps = {
  onClose: () => void;
  outstanding: number;
  aging: ReturnType<typeof hospitalAging>;
};
