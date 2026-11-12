import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartLine, DiscountKind } from "./model";

export type PostedLine = {
  productId: string;
  name: string;
  composition: string | null;
  batchNo: string;
  expiry: string;
  qty: number;
  mrp: string;
  unitPrice: string;
  gst: number;
  offerId: string | null;
  offerTitle: string | null;
  discount: string;
};

export type PostedBill = {
  number: string;
  patientName: string;
  patientPhone: string;
  prescribedBy: string | null;
  prescriptionNumber: string | null;
  payMode: string;
  soldAt: string;
  subtotal: string;
  discount: string;
  payable: string;
  extraType?: string;
  extraValue?: string;
  extraAmount?: string;
  lines: PostedLine[];
};

export type BillingState = {
  lines: CartLine[];
  patientName: string;
  patientPhone: string;
  prescribedBy: string;
  prescriptionNumber: string;
  discountType: DiscountKind;
  discountValue: number;
  posted: PostedBill | null;
  error: string | null;
};

const initialState: BillingState = {
  lines: [],
  patientName: "",
  patientPhone: "",
  prescribedBy: "",
  prescriptionNumber: "",
  discountType: "none",
  discountValue: 0,
  posted: null,
  error: null,
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    linesReplaced(state, action: PayloadAction<CartLine[]>) {
      state.lines = action.payload;
      state.error = null;
    },
    patientSet(state, action: PayloadAction<{ name: string; phone: string }>) {
      state.patientName = action.payload.name;
      state.patientPhone = action.payload.phone;
    },
    prescriptionSet(state, action: PayloadAction<{ doctor: string; number: string }>) {
      state.prescribedBy = action.payload.doctor;
      state.prescriptionNumber = action.payload.number;
    },
    discountSet(state, action: PayloadAction<{ type: DiscountKind; value: number }>) {
      state.discountType = action.payload.type;
      state.discountValue = action.payload.value;
    },
    billPosted(state, action: PayloadAction<PostedBill>) {
      state.posted = action.payload;
      state.lines = [];
      state.error = null;
    },
    billFailed(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    saleCleared(state) {
      state.lines = [];
      state.patientName = "";
      state.patientPhone = "";
      state.prescribedBy = "";
      state.prescriptionNumber = "";
      state.discountType = "none";
      state.discountValue = 0;
      state.posted = null;
      state.error = null;
    },
  },
});

export const {
  linesReplaced,
  patientSet,
  prescriptionSet,
  discountSet,
  billPosted,
  billFailed,
  saleCleared,
} = billingSlice.actions;

export const billingReducer = billingSlice.reducer;
