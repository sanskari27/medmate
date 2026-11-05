import { smsLink } from "@/utils";

export const sms = (phone: string, text: string) =>
  phone && window.open(smsLink(phone, text), "_blank");
