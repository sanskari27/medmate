import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayMode, SaleSource } from "@/utils";
import type { Admission } from "@/utils";
import { checkoutPos } from "@/store/thunks/billing.thunk";
import { dispensePrescription } from "@/store/thunks/prescriptions.thunk";

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
  loading: boolean;
  loaded: boolean;
  saving: boolean;
  error: string | null;
};

const initialState: BillingState = {
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
  loading: false,
  loaded: true,
  saving: false,
  error: null,
};

function sameLine(line: PosLine, id: string, loose?: boolean, batchNo?: string) {
  return (
    line.productId === id && !!line.loose === !!loose && (line.batchNo ?? "") === (batchNo ?? "")
  );
}

function clearCart(state: BillingState) {
  state.pos = [];
  state.posDiscount = 0;
  state.posDiscountMode = "flat";
  state.posCustomer = { ...BLANK_POS_CUSTOMER };
  state.posPay = "cash";
  state.posSource = "counter";
  state.posWard = "";
  state.posInsurer = "";
  state.posPatientId = "";
  state.posRxImage = null;
}

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    posAdd(state, action: PayloadAction<{ id: string; loose?: boolean; batchNo?: string }>) {
      const { id, loose = false, batchNo } = action.payload;
      const existing = state.pos.find((line) => sameLine(line, id, loose, batchNo));
      if (existing) existing.qty += 1;
      else state.pos.push({ productId: id, qty: 1, loose, batchNo });
    },
    posDec(state, action: PayloadAction<{ id: string; loose?: boolean; batchNo?: string }>) {
      const { id, loose = false, batchNo } = action.payload;
      state.pos = state.pos.flatMap((line) =>
        sameLine(line, id, loose, batchNo)
          ? line.qty > 1
            ? [{ ...line, qty: line.qty - 1 }]
            : []
          : [line],
      );
    },
    posSetQty(
      state,
      action: PayloadAction<{ id: string; qty: number; loose?: boolean; batchNo?: string }>,
    ) {
      const { id, qty, loose = false, batchNo } = action.payload;
      state.pos =
        qty <= 0
          ? state.pos.filter((line) => !sameLine(line, id, loose, batchNo))
          : state.pos.map((line) => (sameLine(line, id, loose, batchNo) ? { ...line, qty } : line));
    },
    posRemove(state, action: PayloadAction<{ id: string; loose?: boolean; batchNo?: string }>) {
      const { id, loose = false, batchNo } = action.payload;
      state.pos = state.pos.filter((line) => !sameLine(line, id, loose, batchNo));
    },
    posSetBatch(state, action: PayloadAction<{ id: string; batchNo?: string; loose?: boolean }>) {
      const { id, batchNo, loose = false } = action.payload;
      const target = state.pos.find((line) => line.productId === id && !!line.loose === !!loose);
      if (!target) return;
      const merged = state.pos.find(
        (line) => line !== target && sameLine(line, id, loose, batchNo),
      );
      if (merged) {
        state.pos = state.pos
          .filter((line) => line !== target)
          .map((line) => (line === merged ? { ...line, qty: line.qty + target.qty } : line));
        return;
      }
      target.batchNo = batchNo;
    },
    setPosCustomer(state, action: PayloadAction<Partial<PosCustomer>>) {
      state.posCustomer = { ...state.posCustomer, ...action.payload };
    },
    setPosDiscount(state, action: PayloadAction<number>) {
      state.posDiscount = action.payload;
    },
    setPosDiscountMode(state, action: PayloadAction<"flat" | "percent">) {
      state.posDiscountMode = action.payload;
    },
    setPosPay(state, action: PayloadAction<PayMode>) {
      state.posPay = action.payload;
    },
    setPosSource(state, action: PayloadAction<SaleSource>) {
      state.posSource = action.payload;
    },
    setPosWard(state, action: PayloadAction<string>) {
      state.posWard = action.payload;
    },
    setPosInsurer(state, action: PayloadAction<string>) {
      state.posInsurer = action.payload;
    },
    setPosPatientId(state, action: PayloadAction<string>) {
      state.posPatientId = action.payload;
    },
    setPosRxImage(state, action: PayloadAction<string | null>) {
      state.posRxImage = action.payload;
    },
    posClear(state) {
      clearCart(state);
    },
    beginWardBilling(state, action: PayloadAction<Admission>) {
      const admission = action.payload;
      state.posCustomer = {
        ...BLANK_POS_CUSTOMER,
        name: admission.name,
        phone: admission.phone,
        doctor: admission.doctor,
        rxSource: admission.doctor ? "doctor" : "self",
      };
      state.posSource = "ward";
      state.posWard = admission.wardName;
      state.posPatientId = admission.patientId;
      if (admission.payerType === "insurance") {
        state.posPay = "insurance";
        state.posInsurer = admission.insurer ?? "";
      } else {
        state.posPay = "cash";
        state.posInsurer = "";
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkoutPos.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(checkoutPos.fulfilled, (state) => {
        clearCart(state);
        state.saving = false;
      })
      .addCase(checkoutPos.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Bill failed";
      })
      .addCase(dispensePrescription.fulfilled, (state, action) => {
        const prescription = action.payload;
        state.pos = prescription.items.map((productId) => ({ productId, qty: 1 }));
        state.posCustomer = {
          ...BLANK_POS_CUSTOMER,
          name: prescription.patient,
          phone: prescription.phone === "—" ? "" : prescription.phone,
          doctor: prescription.doctor,
          rxSource: "doctor",
        };
      });
  },
});

export const {
  beginWardBilling,
  posAdd,
  posClear,
  posDec,
  posRemove,
  posSetBatch,
  posSetQty,
  setPosCustomer,
  setPosDiscount,
  setPosDiscountMode,
  setPosInsurer,
  setPosPatientId,
  setPosPay,
  setPosRxImage,
  setPosSource,
  setPosWard,
} = billingSlice.actions;

export default billingSlice.reducer;
