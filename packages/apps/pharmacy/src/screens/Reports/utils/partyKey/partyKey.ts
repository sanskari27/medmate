import { Sale } from "@/utils";

export const partyKey = (s: Sale) =>
  s.customer.name + (s.customer.phone ? ` · ${s.customer.phone}` : "");
