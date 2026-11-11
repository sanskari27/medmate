import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { AUTH_SESSION_CLEARED, AUTH_SESSION_STARTED } from "@/constants";
import type { Session } from "@/types";

export type AuthState = {
  session: Session | null;
  pinReset: boolean;
};

const initialState: AuthState = {
  session: null,
  pinReset: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<{ session: Session; pinReset: boolean }>) {
      state.session = action.payload.session;
      state.pinReset = action.payload.pinReset;
    },
    pinSaved(state) {
      state.pinReset = false;
      if (state.session) state.session.account.pinSetupRequired = false;
    },
    sessionCleared(state) {
      state.session = null;
      state.pinReset = false;
    },
  },
});

type AuthActionName = "sessionStarted" | "sessionCleared";

function expectAuthAction<Name extends AuthActionName>(name: Name, type: `auth/${Name}`) {
  if (type !== `auth/${name}`) {
    throw new Error(`${type} does not match auth/${name}`);
  }
}

expectAuthAction("sessionStarted", AUTH_SESSION_STARTED);
expectAuthAction("sessionCleared", AUTH_SESSION_CLEARED);

export function selectAuth(state: { auth: AuthState }): AuthState {
  return state.auth;
}

export const { sessionStarted, pinSaved, sessionCleared } = authSlice.actions;
export const authReducer = authSlice.reducer;
