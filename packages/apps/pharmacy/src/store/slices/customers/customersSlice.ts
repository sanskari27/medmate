import type { CreditPayment, Referral } from "@/utils";
import { createFieldSlice } from "@/app/store/createFieldSlice";

export type CustomersState = { creditPayments: CreditPayment[]; referrals: Referral[] };

const customersSlice = createFieldSlice<CustomersState>("customers", {
  creditPayments: [],
  referrals: [],
});
export const setCustomersField = customersSlice.actions.setField;
export const customersReducer = customersSlice.reducer;
