import type { PayMode, PharmacyProfile, Prescription, Sale } from "@/utils";
import type { OrderTab } from "../../Orders.types";

export type OrderDetailProps = {
  sale: Sale;
  rx?: Prescription;
  profile: PharmacyProfile;
  onClose: () => void;
  onAdvance: () => void;
  onCancel: () => void;
  onMarkPaid: (mode: PayMode) => void;
  onShare: () => void;
  onOpenRx: () => void;
  onPack?: () => void;
  now: number;
  initialTab?: OrderTab;
};
