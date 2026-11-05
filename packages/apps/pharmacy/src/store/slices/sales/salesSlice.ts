import type { Offer, Sale } from "@/utils";
import { createFieldSlice } from "@/app/store/createFieldSlice";

export type SalesState = { sales: Sale[]; offers: Offer[]; lastInvoice: Sale | null };

const salesSlice = createFieldSlice<SalesState>("sales", {
  sales: [],
  offers: [],
  lastInvoice: null,
});
export const setSalesField = salesSlice.actions.setField;
export const salesReducer = salesSlice.reducer;
