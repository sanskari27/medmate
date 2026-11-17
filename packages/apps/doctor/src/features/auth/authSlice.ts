import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { AUTH_SESSION_CLEARED, AUTH_SESSION_STARTED } from "@/constants";
import type { Session, SignStep } from "@/types";

export type AuthState = {
  session: Session | null;
  pinReset: boolean;
  step: SignStep;
};

const initialState: AuthState = {
  session: null,
  pinReset: false,
  step: "phone",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<{ session: Session; pinReset: boolean }>) {
      state.session = action.payload.session;
      state.pinReset = action.payload.pinReset;
    },
    sessionCleared(state) {
      state.session = null;
      state.pinReset = false;
      state.step = "phone";
    },
    stepChanged(state, action: PayloadAction<SignStep>) {
      state.step = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(AUTH_SESSION_STARTED, (state, action) => {
      const payload = (action as { payload?: { session: Session; pinReset: boolean } }).payload;
      if (!payload) return;
      state.session = payload.session;
      state.pinReset = payload.pinReset;
    });
    builder.addCase(AUTH_SESSION_CLEARED, (state) => {
      state.session = null;
      state.pinReset = false;
      state.step = "phone";
    });
  },
});

export const { sessionStarted, sessionCleared, stepChanged } = authSlice.actions;
export const authReducer = authSlice.reducer;
