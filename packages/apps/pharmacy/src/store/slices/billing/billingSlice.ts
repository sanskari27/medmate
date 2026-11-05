import type { PayMode, SaleSource } from "@/utils";
import { createFieldSlice } from "@/store/createFieldSlice";

export type PosLine = { productId: string; qty: number; loose?: boolean; batchNo?: string };
export type PosCustomer = {
  name: string;
  phone: string;
  email: string;
  rxSource: "doctor" | "self";
  doctor: string;
};
export const BLANK_POS_CUSTOMER: PosCustomer = {
  name: "",
  phone: "",
  email: "",
  rxSource: "doctor",
  doctor: "",
};

export type BillingState = {
  pos: PosLine[];
  posCustomer: PosCustomer;
  posDiscount: number;
  posDiscountMode: "flat" | "percent";
  posPay: PayMode;
  posSource: SaleSource;
  posWard: string;
  posInsurer: string;
  posPatientId: string;
  posRxImage: string | null;
};

const billingSlice = createFieldSlice<BillingState>("billing", {
  pos: [],
  posCustomer: { ...BLANK_POS_CUSTOMER },
  posDiscount: 0,
  posDiscountMode: "flat",
  posPay: "cash",
  posSource: "counter",
  posWard: "",
  posInsurer: "",
  posPatientId: "",
  posRxImage: null,
});
export const setBillingField = billingSlice.actions.setField;
export const billingReducer = billingSlice.reducer;
