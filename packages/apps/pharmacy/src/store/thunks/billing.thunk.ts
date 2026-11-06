import { billingService } from "@/services/api/endpoints/billing";
import { showToast } from "@/store/actions/feedback.actions";
import { loadSession } from "@/store/thunks/auth.thunk";
import { write } from "@/store/write";
import type { InvProduct, PayMode, Prescription, Sale, SaleSource } from "@/utils";
import { createAsyncThunk } from "@reduxjs/toolkit";

type Gate = {
  auth: { signedIn: boolean };
  billing: {
    pos: { productId: string; qty: number; loose?: boolean; batchNo?: string }[];
    posCustomer: {
      name: string;
      phone: string;
      email: string;
      rxSource: "doctor" | "self";
      doctor: string;
    };
    posDiscount: number;
    posDiscountMode: "flat" | "percent";
    posPay: PayMode;
    posSource: SaleSource;
    posWard: string;
    posInsurer: string;
    posPatientId: string;
    posRxImage: string | null;
  };
  inventory: { inventory: InvProduct[] };
};

export type CheckoutResult = {
  sale: Sale;
  prescription: Prescription | null;
  inventory: InvProduct[];
};

export const checkoutPos = createAsyncThunk<
  CheckoutResult,
  { paid?: boolean; ward?: string } | undefined,
  { state: Gate; rejectValue: string }
>("billing/checkoutPos", async (options, { dispatch, getState, rejectWithValue }) => {
  const billing = getState().billing;
  if (billing.pos.length === 0) return rejectWithValue("Nothing to bill");
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Bill failed",
    reload: () => dispatch(loadSession()).unwrap(),
    rejectWithValue,
    work: async () => {
      const result = await billingService.checkout({
        lines: billing.pos,
        customer: billing.posCustomer,
        discount: billing.posDiscount,
        discountMode: billing.posDiscountMode,
        payMode: billing.posPay,
        source: billing.posSource,
        ward: options?.ward || billing.posWard,
        insurer: billing.posInsurer,
        patientId: billing.posPatientId,
        rxImage: billing.posRxImage,
        paid: options?.paid,
      });
      dispatch(
        showToast(
          result.sale.paid
            ? "Invoice " + result.sale.id + " created"
            : "Bill " + result.sale.id + " sent to reception · payment pending",
        ),
      );
      return result;
    },
  });
});
