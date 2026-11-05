import { waLink } from "@/domain";

export const wa = (phone: string, text: string) =>
  phone && window.open(waLink(phone, text), "_blank");
