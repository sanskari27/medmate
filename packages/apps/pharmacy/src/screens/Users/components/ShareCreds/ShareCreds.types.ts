import type { StaffUser } from "@/utils";

export type ShareCredsProps = {
  user: StaffUser;
  pharmacy: string;
  onClose: () => void;
};
