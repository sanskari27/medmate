import { createSlice } from "@reduxjs/toolkit";
import type { Prescription } from "@/utils";
import type { SessionSnapshot } from "@/store/session";
import { loadSession, signOutRequest } from "@/store/thunks/auth.thunk";
import { checkoutPos } from "@/store/thunks/billing.thunk";

export type PrescriptionsState = {
  prescriptions: Prescription[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
};

const initialState: PrescriptionsState = {
  prescriptions: [],
  loading: false,
  loaded: false,
  error: null,
};

function applyPrescriptions(state: PrescriptionsState, session: SessionSnapshot) {
  state.prescriptions = session.prescriptions || [];
}

const prescriptionsSlice = createSlice({
  name: "prescriptions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        if (!state.loaded) state.loading = true;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        applyPrescriptions(state, action.payload);
        state.loading = false;
        state.loaded = true;
      })
      .addCase(loadSession.rejected, (state) => {
        state.loading = false;
        state.loaded = true;
      })
      .addCase(checkoutPos.fulfilled, (state, action) => {
        const prescription = action.payload.prescription;
        if (!prescription) return;
        state.prescriptions = [
          prescription,
          ...state.prescriptions.filter((row) => row.id !== prescription.id),
        ];
      })
      .addCase(signOutRequest.fulfilled, () => initialState);
  },
});

export default prescriptionsSlice.reducer;
