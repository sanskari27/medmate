import type { PharmacyProfile, Sale } from "@/utils";

export type ShareSheetProps = {
  sale: Sale;
  profile: PharmacyProfile;
  onClose: () => void;
  className?: string;
};

export type ShareKind = "whatsapp" | "sms" | "email" | "pdf";

export type ShareOption = {
  kind: ShareKind;
  title: string;
  subtitle: string;
  onClick: () => void;
};
