import { Sale } from "@/utils";

export const isOutstanding = (s: Sale) =>
  s.channel === "online" && s.payMode === "cod" && !["delivered", "cancelled"].includes(s.status);
