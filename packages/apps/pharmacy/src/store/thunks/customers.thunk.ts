import { createAsyncThunk } from "@/store/createAsyncThunk";
import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import { customersService } from "@/services/api/endpoints/customers";
import type { PayMode, Referral } from "@/utils";
import { showToast } from "@/store/actions/feedback.actions";
import { loadSession } from "@/store/thunks/auth.thunk";
import { write } from "@/store/write";

type Gate = { auth: { signedIn: boolean } };
type Dispatch = ThunkDispatch<Gate, unknown, Action>;
const reload = (dispatch: Dispatch) => () => dispatch(loadSession()).unwrap();

export const recordCreditPayment = createAsyncThunk<
  {
    custKey: string;
    custName: string;
    custPhone: string;
    amount: number;
    mode: PayMode;
    note?: string;
  },
  {
    custKey: string;
    custName: string;
    custPhone: string;
    amount: number;
    mode: PayMode;
    note?: string;
  },
  { state: Gate; rejectValue: string }
>("customers/recordCreditPayment", async (payment, { dispatch, getState, rejectWithValue }) => {
  if (payment.amount <= 0) return rejectWithValue("Amount must be positive");
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not record the repayment",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await customersService.recordCreditPayment(payment);
      dispatch(
        showToast("Repayment recorded · ₹" + Math.round(payment.amount).toLocaleString("en-IN")),
      );
      return payment;
    },
  });
});

export const addReferral = createAsyncThunk<
  { name: string; area?: string },
  { name: string; area?: string },
  { state: Gate; rejectValue: string }
>("customers/addReferral", async (referral, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not invite the pharmacy",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await customersService.addReferral(referral);
      dispatch(showToast(referral.name + " invited"));
      return referral;
    },
  }),
);

export const updateReferral = createAsyncThunk<
  { id: string; patch: Partial<Referral> },
  { id: string; patch: Partial<Referral> },
  { state: Gate; rejectValue: string }
>("customers/updateReferral", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the referral",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await customersService.updateReferral(body.id, body.patch);
      return body;
    },
  }),
);
