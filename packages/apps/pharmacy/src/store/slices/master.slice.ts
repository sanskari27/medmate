import { createSlice } from "@reduxjs/toolkit";
import type {
  MasterAudit,
  MasterBooking,
  MasterCoupon,
  MasterPharmacy,
  MasterProfile,
  MasterReferral,
  MasterRequest,
  MasterTicket,
} from "@/services/api/endpoints/master";
import { signOutRequest } from "@/store/thunks/auth.thunk";
import {
  issueCoupon,
  loadCoupons,
  loadMasterAudit,
  loadMasterDesk,
  loadMasterSession,
  masterSignOut,
  openMasterPharmacy,
} from "@/store/thunks/master.thunk";

export type MasterState = {
  phone: string | null;
  sessionLoaded: boolean;
  pharmacies: MasterPharmacy[];
  requests: MasterRequest[];
  tickets: MasterTicket[];
  referrals: MasterReferral[];
  bookings: MasterBooking[];
  audit: MasterAudit[];
  profile: MasterProfile | null;
  coupons: MasterCoupon[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
};

const initialState: MasterState = {
  phone: null,
  sessionLoaded: false,
  pharmacies: [],
  requests: [],
  tickets: [],
  referrals: [],
  bookings: [],
  audit: [],
  profile: null,
  coupons: [],
  loading: false,
  loaded: false,
  error: null,
};

const masterSlice = createSlice({
  name: "master",
  initialState,
  reducers: {
    clearMasterProfile(state) {
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMasterSession.fulfilled, (state, action) => {
        state.phone = action.payload;
        state.sessionLoaded = true;
      })
      .addCase(loadMasterSession.rejected, (state) => {
        state.phone = null;
        state.sessionLoaded = true;
      })
      .addCase(loadMasterDesk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMasterDesk.fulfilled, (state, action) => {
        state.pharmacies = action.payload.pharmacies;
        state.requests = action.payload.requests;
        state.tickets = action.payload.tickets;
        state.referrals = action.payload.referrals;
        state.bookings = action.payload.bookings;
        state.loading = false;
        state.loaded = true;
      })
      .addCase(loadMasterDesk.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.error = action.payload ?? "Could not load the master desk";
      })
      .addCase(loadMasterAudit.fulfilled, (state, action) => {
        state.audit = action.payload;
      })
      .addCase(loadMasterAudit.rejected, (state, action) => {
        state.error = action.payload ?? null;
      })
      .addCase(openMasterPharmacy.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(openMasterPharmacy.rejected, (state, action) => {
        state.error = action.payload ?? null;
      })
      .addCase(loadCoupons.fulfilled, (state, action) => {
        state.coupons = action.payload;
        state.error = null;
      })
      .addCase(loadCoupons.rejected, (state, action) => {
        state.error = action.payload ?? null;
      })
      .addCase(issueCoupon.rejected, (state, action) => {
        state.error = action.payload ?? null;
      })
      .addCase(masterSignOut.fulfilled, (state) => {
        state.phone = null;
      })
      .addCase(signOutRequest.fulfilled, () => ({ ...initialState, sessionLoaded: true }));
  },
});

export const { clearMasterProfile } = masterSlice.actions;
export default masterSlice.reducer;
