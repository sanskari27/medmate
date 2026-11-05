import type { PayMode, SaleSource } from "@/utils";

export type RegisterPaid = "all" | "paid" | "unpaid";

export type RegisterQuery = {
  source: "all" | SaleSource;
  payMode: "all" | PayMode;
  paid: RegisterPaid;
  insurer: string;
  ward: string;
  searchQuery: string;
};
