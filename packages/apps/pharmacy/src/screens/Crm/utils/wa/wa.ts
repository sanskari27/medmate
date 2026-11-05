import { waLink } from "@/utils";

export const wa = (phone: string, text: string) =>
  phone && window.open(waLink(phone, text), "_blank");
