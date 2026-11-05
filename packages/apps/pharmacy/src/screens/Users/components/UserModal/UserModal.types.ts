import type { StaffUser } from "@/utils";

export type UserModalProps = {
  user: StaffUser | null;
  onClose: () => void;
  onSave: (payload: Partial<StaffUser>, id?: string) => Promise<unknown>;
  onShare: (user: StaffUser) => void;
};
