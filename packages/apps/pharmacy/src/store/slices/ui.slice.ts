import { createSlice } from "@reduxjs/toolkit";
import { routeFromPath } from "@/app/routes";
import type { Route } from "@/types";
import type { SaveFault } from "@/utils";
import {
  clearFormFault,
  clearToast,
  openReport,
  popRoute,
  pushRoute,
  refuseDelete,
  resetRoute,
  setBillIndentTarget,
  setFormFault,
  setInvFilter,
  setLeaveOpen,
  setPricingUnlocked,
  setQuietRefresh,
  showToast,
  stampNow,
} from "@/store/actions/feedback.actions";
import type { SessionTicket } from "@/store/session";
import { loadSession, signOutRequest } from "@/store/thunks/auth.thunk";

export type UiState = {
  leaveOpen: boolean;
  route: Route;
  routeHistory: Route[];
  canGoBack: boolean;
  nav: "push" | "replace" | "scroll" | "none";
  invFilter: string | null;
  toastMsg: string | null;
  formFault: SaveFault | null;
  billIndentTarget: string | null;
  pricingUnlocked: boolean;
  tickets: SessionTicket[];
  quietRefresh: boolean;
  now: number;
  loading: boolean;
  loaded: boolean;
  error: string | null;
};

function initialRoute(): Route {
  if (typeof window === "undefined") return "dashboard";
  return routeFromPath(window.location.pathname);
}

const initialState: UiState = {
  leaveOpen: false,
  route: initialRoute(),
  routeHistory: [],
  canGoBack: false,
  nav: "none",
  invFilter: null,
  toastMsg: null,
  formFault: null,
  billIndentTarget: null,
  pricingUnlocked: false,
  tickets: [],
  quietRefresh: false,
  now: 0,
  loading: false,
  loaded: false,
  error: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(showToast, (state, action) => {
        state.toastMsg = action.payload;
      })
      .addCase(clearToast, (state) => {
        state.toastMsg = null;
      })
      .addCase(refuseDelete, (state) => {
        state.toastMsg = "Records cannot be deleted";
      })
      .addCase(setFormFault, (state, action) => {
        state.formFault = action.payload;
      })
      .addCase(clearFormFault, (state) => {
        state.formFault = null;
      })
      .addCase(pushRoute, (state, action) => {
        if (action.payload === state.route) {
          state.nav = "scroll";
          return;
        }
        state.routeHistory.push(state.route);
        if (state.routeHistory.length > 60) state.routeHistory.shift();
        state.route = action.payload;
        state.canGoBack = true;
        state.formFault = null;
        state.nav = "push";
      })
      .addCase(popRoute, (state) => {
        const previous = state.routeHistory.pop();
        if (previous === undefined) return;
        state.route = previous;
        state.canGoBack = state.routeHistory.length > 0;
        state.nav = "push";
      })
      .addCase(resetRoute, (state, action) => {
        state.routeHistory = [];
        state.route = action.payload;
        state.canGoBack = false;
        state.nav = "replace";
      })
      .addCase(setQuietRefresh, (state, action) => {
        state.quietRefresh = action.payload;
      })
      .addCase(setPricingUnlocked, (state, action) => {
        state.pricingUnlocked = action.payload;
      })
      .addCase(setLeaveOpen, (state, action) => {
        state.leaveOpen = action.payload;
      })
      .addCase(setInvFilter, (state, action) => {
        state.invFilter = action.payload;
      })
      .addCase(openReport, (state) => {
        if (state.route !== "reports") {
          state.routeHistory.push(state.route);
          state.route = "reports";
          state.canGoBack = true;
          state.nav = "push";
        }
      })
      .addCase(setBillIndentTarget, (state, action) => {
        state.billIndentTarget = action.payload;
      })
      .addCase(stampNow, (state, action) => {
        if (state.now === 0) state.now = action.payload;
      })
      .addCase(loadSession.pending, (state) => {
        if (!state.loaded) state.loading = true;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.tickets = action.payload.tickets || [];
        state.loading = false;
        state.loaded = true;
        state.error = null;
      })
      .addCase(loadSession.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
        if (action.payload && action.payload !== "UNAUTHORIZED") state.error = action.payload;
      })
      .addCase(signOutRequest.fulfilled, (state) => {
        const now = state.now;
        return { ...initialState, now, route: initialRoute(), loaded: true };
      });
  },
});

export default uiSlice.reducer;
