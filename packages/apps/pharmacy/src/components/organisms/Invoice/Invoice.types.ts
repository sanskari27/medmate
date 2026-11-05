import type { PharmacyProfile, Sale } from "@/utils";

export type InvoiceProps = {
  sale: Sale;
  profile: PharmacyProfile;
  className?: string;
};
