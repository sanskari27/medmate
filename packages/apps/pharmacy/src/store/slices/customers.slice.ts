import { createSlice } from "@reduxjs/toolkit";
import type { CreditPayment, Referral } from "@/utils";
import type { SessionSnapshot } from "@/store/session";
import { loadSession, signOutRequest } from "@/store/thunks/auth.thunk";
import { updateReferral } from "@/store/thunks/customers.thunk";

export type CustomersState = {
  creditPayments: CreditPayment[];
  referrals: Referral[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
};

const initialState: CustomersState = {
  creditPayments: [],
  referrals: [],
  loading: false,
  loaded: false,
  error: null,
};

function applyCustomers(state: CustomersState, session: SessionSnapshot) {
  state.creditPayments = session.creditPayments || [];
  state.referrals = session.referrals || [];
}

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        if (!state.loaded) state.loading = true;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        applyCustomers(state, action.payload);
        state.loading = false;
        state.loaded = true;
      })
      .addCase(loadSession.rejected, (state) => {
        state.loading = false;
        state.loaded = true;
      })
      .addCase(updateReferral.fulfilled, (state, action) => {
        state.referrals = state.referrals.map((referral) =>
          referral.id === action.payload.id ? { ...referral, ...action.payload.patch } : referral,
        );
      })
      .addCase(signOutRequest.fulfilled, () => initialState);
  },
});

export default customersSlice.reducer;
